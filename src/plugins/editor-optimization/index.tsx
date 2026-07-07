import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import styles from "./styles.less";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import Tooltip from "components/Tooltip";
import toast from "react-hot-toast";
import { Box, Input, IconButton } from "@gandi-ide/gandi-ui";
import * as PIXI from "pixi.js"; // 新增 PixiJS 导入
import {
  getGroups, getActiveGroupId, setActiveGroupId, addGroup, deleteGroup, renameGroup,
  setBlockGroup, getBlockGroup, restoreBlockGroupFromXml, loadFromLocalStorage,
  setGlobalVM, ALL_GROUPS_ID, UNGROUPED_ID,lockCommentWrite 
} from "./utils";
import {
  saveTargetToOffscreen,
  restoreTargetFromOffscreen,
  initTargetCacheAndSwitchToGroup,
  switchGroup,
  getOffscreenWorkspace,
  moveBlockTreeToWorkspace, 
  disposeOffscreenCache,
} from "./offscreenCache";
import { PixiBlockRenderer, extractTreeBlocks } from './pixiRenderer';


// ... 图标组件定义保持不变 ...
const AddIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>);
const DeleteIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);
const CheckIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>);
const GroupIcon = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>);



const DEFAULT_CONTAINER_INFO = { width: 229, height: 360, translateX: 72, translateY: 60 };

declare global {
  interface Window {
    __EDITOR_OPT_FAST_CLEAR_ENABLED__?: boolean;
    __FAST_CLEAR_MODE__?: boolean;
    __ORIGINAL_DISPOSE_SVG__?: any;
    __ORIGINAL_CLEAR_WS_SVG__?: any;
    __SKIP_LAYOUT_UPDATE__?: boolean;
    __FILTER_TOP_BLOCKS_FOR_SERIALIZATION__?: boolean;
    __ENABLE_FULLSCREEN_OPTIMIZATION__?: boolean;
    __IN_FULLSCREEN_MODE__?: boolean;
    __SKIP_TEXT_TO_DOM__?: boolean;
    __ENABLE_PIXI_OPTIMIZATION__?: boolean; // 新增全局标志（可选）
    __IS_COLLABORATION__?: boolean;//是否为协作。别问我怎么判断的。
  }
}

// ... 原有工具函数 ...
function getRootBlock(block: any): any {
  let r = block;
  while (r?.getParent?.()) r = r.getParent();
  return r;
}

function extractTopLevelBlocks(xmlString: string): Element[] {
  try {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    const root = doc.documentElement;
    if (!root) return [];
    return Array.from(root.children)
      .filter(c => c.tagName.toLowerCase() === 'block')
      .map(c => c.cloneNode(true) as Element);
  } catch {
    return [];
  }
}

function getGroupIdFromBlockXml(xmlBlock: Element): string {
  const commentNode = xmlBlock.querySelector('comment');
  if (!commentNode) return UNGROUPED_ID;
  const commentText = commentNode.textContent || '';
  const separator = '|EdiOpt|';
  const sepIdx = commentText.indexOf(separator);
  if (sepIdx <= 0) return UNGROUPED_ID;
  return commentText.substring(0, sepIdx);
}
const EditorOptimization: React.FC<PluginContext> = ({ vm, blockly, workspace, registerSettings, teamworkManager,msg }) => {
  const [visible, setVisible] = React.useState(false);
  const [targetId, setTargetId] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<any[]>([]);
  const [activeGroupId, setActiveGroupIdState] = React.useState<string>(ALL_GROUPS_ID);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [containerInfo, setContainerInfo] = React.useState<ExpansionRect>(DEFAULT_CONTAINER_INFO);
  const containerInfoRef = React.useRef(containerInfo);
  //Pixi引用定义
  const pixiRendererRef = useRef<PixiBlockRenderer | null>(null);
  // 用于记录上一个编辑目标，以便切出时保存到离屏缓存
  const lastTargetIdRef = React.useRef<string | null>(null);
  React.useEffect(() => { setGlobalVM(vm); }, [vm]);
  React.useEffect(() => { loadFromLocalStorage(); }, []);

  // 新增：Pixi 优化开关状态
  const [pixiEnabled, setPixiEnabled] = React.useState(false);

  // ... refreshGroups、handleClick、handleSelectGroup、handleAddGroup、handleDeleteGroup、startEdit、saveEdit 保持不变 ...
  const refreshGroups = React.useCallback(() => {
    if (!targetId) return;
    setGroups(getGroups(targetId));
    setActiveGroupIdState(getActiveGroupId(targetId));
  }, [targetId]);

  React.useEffect(() => {
    const update = () => {
      const id = (vm as any).editingTarget?.id || (vm as any).runtime?._editingTarget?.id || null;
      if (id && id !== targetId) setTargetId(id);
    };
    update();
    const iv = setInterval(update, 200);
    return () => clearInterval(iv);
  }, [vm, targetId]);

  React.useEffect(() => { refreshGroups(); }, [targetId, refreshGroups]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContainerInfo({ ...containerInfoRef.current, translateX: rect.x + 28, translateY: rect.y - 6 });
    setVisible(true);
    refreshGroups();
  };

  const handleSelectGroup = (groupId: string) => {
    if (!targetId) return;
        //切换分组时刷新
      if (pixiEnabled) {
        requestAnimationFrame(() => {
          (window as any).__PIXI_REFRESH_OVERLAY__?.();
          console.log('__PIXI_REFRESH_OVERLAY__')
          });
      }
    if (getOffscreenWorkspace(targetId)) {
      try {
        switchGroup(targetId, groupId, workspace, blockly, getBlockGroup, ALL_GROUPS_ID);
        setActiveGroupIdState(groupId);
        setActiveGroupId(targetId, groupId);
        (vm as any).emitWorkspaceUpdate?.();
        refreshGroups();
        //立即将主工作区中尚未被 Pixi 覆盖的积木加入队列
        if (pixiEnabled && pixiRendererRef.current) {
          const allTopBlocks = workspace.getTopBlocks(false);
          const renderer = pixiRendererRef.current;
          const toAdd = allTopBlocks.filter(
            (b: any) => !renderer.hasPixiForRoot(b.id) && !renderer['domOnlyRoots']?.has(b.id)
          );
          if (toAdd.length > 0) {
            renderer.addBlocks(toAdd);
          }
        }
      } catch (e) {
        console.error('离屏分组切换失败', e);
        toast.error(msg('plugins.editorOptimization.groupSwitchFail'));
      }
      return;
    } else {
      setActiveGroupId(targetId, groupId);
      setActiveGroupIdState(groupId);
      // 触发完整重新加载，让劫持按新分组过滤加载
      (vm as any).emitWorkspaceUpdate?.();
      refreshGroups();
      return;
  }
  };

  const handleAddGroup = () => {
    if (!targetId) return;
    if (!newGroupName.trim()) { toast.error(msg('plugins.editorOptimization.enterGroupName')); return; }
    addGroup(targetId, newGroupName.trim());
    setNewGroupName("");
    refreshGroups();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!targetId) return;
    if (groupId === UNGROUPED_ID) { toast.error(msg('plugins.editorOptimization.defaultGroupUndeletable')); return; }
    deleteGroup(targetId, groupId);
    refreshGroups();
  };

  const startEdit = (id: string, name: string) => { setEditingGroupId(id); setEditingName(name); };
  const saveEdit = () => {
    if (!targetId || !editingGroupId) return;
    if (!editingName.trim()) { toast.error(msg('plugins.editorOptimization.groupNameEmpty')); return; }
    renameGroup(targetId, editingGroupId, editingName.trim());
    setEditingGroupId(null);
    setEditingName("");
    refreshGroups();
  };

  //设置注册（包含新增的 Pixi 加速选项）
  React.useEffect(() => {
    if (!registerSettings) return;
    const dispose = registerSettings(
      msg('plugins.editorOptimization.title'),
      'plugin-editor-optimization',
      [
        {
          key: 'group',
          label: msg('plugins.editorOptimization.title'),
          description: msg('plugins.editorOptimization.description'),
          items: [
            {
              key: 'enableFastClear',
              type: 'switch',
              label: msg('plugins.editorOptimization.enableFastClearLabel'),
              description: msg('plugins.editorOptimization.enableFastClearDesc'),
              value: false,
              onChange: (v: boolean) => {
                window.__EDITOR_OPT_FAST_CLEAR_ENABLED__ = v;
              }
            },
            {
              key: 'enableFullscreenOptimize',
              type: 'switch',
              label: msg('plugins.editorOptimization.enableFullscreenLabel'),
              description: msg('plugins.editorOptimization.enableFullscreenDesc'),
              value: false,
              onChange: (v: boolean) => {
                window.__ENABLE_FULLSCREEN_OPTIMIZATION__ = v;
              }
            },
            // 新增 Pixi 加速选项
            {
              key: 'enablePixiOptimization',
              type: 'switch',
              label: msg('plugins.editorOptimization.enablePixiLabel'),
              description: msg('plugins.editorOptimization.enablePixiDesc'),
              value: false,
              onChange: (v: boolean) => {
                window.__ENABLE_PIXI_OPTIMIZATION__ = v;
                setPixiEnabled(v);
              }
            }
          ]
        }
      ],
      <GroupIcon />
    );
    return () => dispose.dispose();
  }, [registerSettings]);
  // 因为我根本不知道协作是否有状态标识，所以我们直接检测是否存在协作特有的GUI按钮。方法已废弃，有teamworkManager这个东西啦。
  /*
  if (!window.hasOwnProperty('__IS_COLLABORATION__')) {
    (window as any).__IS_COLLABORATION__ = !!document.querySelector(
      'div.gandi_teamwork-log_log-icon-btn_3XmSR'
    );
    if ((window as any).__IS_COLLABORATION__) {
      console.log('[editor-optimization]检测到是协作环境,已禁用离屏缓存。')
    }
  }*/
   if (teamworkManager && !(window as any).__IS_COLLABORATION__) {
    (window as any).__IS_COLLABORATION__ = true;
    console.log('[editor-optimization] 检测到协作环境，已禁用离屏缓存。');
  }
  // 核心劫持：clearWorkspaceAndLoadFromXml（集成离屏缓存）
  React.useEffect(() => {
    if (!blockly || !workspace || !vm) return;

    const origClear = blockly.Xml?.clearWorkspaceAndLoadFromXml;
    const origDom = blockly.Xml?.domToBlock;
    const origClearWs = blockly.Xml?.clearWorkspace;

    if (!origClear || !origDom) return;
    const origDomToWorkspace = blockly.Xml?.domToWorkspace;

    blockly.Xml.domToWorkspace = function(xml: Element, targetWorkspace: any) {
      if ((window as any).__IS_COLLABORATION__) {
        const ct = (vm as any).editingTarget || (vm as any).runtime?._editingTarget;
        if (ct) {
          const activeId = getActiveGroupId(ct.id);
          if (activeId !== ALL_GROUPS_ID) {
            const clone = xml.cloneNode(true) as Element;
            // 收集属于当前分组的 block id
            const keepBlockIds = new Set<string>();
            const children = Array.from(clone.children);
            for (const child of children) {
              if (child.tagName.toLowerCase() === 'block') {
                const groupId = getGroupIdFromBlockXml(child);
                if (groupId === activeId) {
                  const blockId = child.getAttribute('id');
                  if (blockId) keepBlockIds.add(blockId);
                } else {
                  clone.removeChild(child);
                }
              }
            }
            // 移除不属于当前分组 block 的 comment 元素
            const commentNodes = clone.querySelectorAll('comment');
            for (const commentNode of commentNodes) {
              const commentId = commentNode.getAttribute('id');
              if (commentId && !keepBlockIds.has(commentId)) {
                commentNode.parentNode?.removeChild(commentNode);
              }
            }
            return origDomToWorkspace.call(this, clone, targetWorkspace);
          }
        }
      }
      return origDomToWorkspace.call(this, xml, targetWorkspace);
    };
    blockly.Xml.clearWorkspaceAndLoadFromXml = function(xml: any, ...args: any[]) {
      const ct = (vm as any).editingTarget || (vm as any).runtime?._editingTarget;
      const tw = workspace || this;
      if (!ct) return origClear.call(this, xml, ...args);
        //协作模式下通过类原生加载，过滤非分组积木。
        if ((window as any).__IS_COLLABORATION__) {
          const result = origClear.call(this, xml, ...args);
          if ((window as any).__ENABLE_PIXI_OPTIMIZATION__) {
            requestAnimationFrame(() => {
              (window as any).__PIXI_REFRESH_OVERLAY__?.();
            });
          }
          return result;
        }
      const newTargetId = ct.id;
      // 切出旧角色：保存到离屏
      if (lastTargetIdRef.current && lastTargetIdRef.current !== newTargetId) {
        try {
          saveTargetToOffscreen(lastTargetIdRef.current, workspace, blockly);
        } catch (e) {
          console.warn('[离屏缓存] 保存旧角色失败', e);
        }
      }
      lastTargetIdRef.current = newTargetId;

      const activeId = getActiveGroupId(newTargetId);
      // 如果是同一个编辑目标且工作区已有积木，说明是视图切换引起的多余调用，直接保留现状
      if (lastTargetIdRef.current === newTargetId && tw.getTopBlocks(false).length > 0) {
          if ((window as any).__ENABLE_PIXI_OPTIMIZATION__) {
            requestAnimationFrame(() => {
        (window as any).__PIXI_REFRESH_OVERLAY__?.();
      });
    }
        return tw;
      }
      lastTargetIdRef.current = newTargetId;
      // 尝试从离屏恢复
      if (getOffscreenWorkspace(newTargetId)) {
        try {
          
          // 清空主工作区（不 dispose）
          if (window.__EDITOR_OPT_FAST_CLEAR_ENABLED__) {
            tw.clear();
          } else {
            const topBlocks = [...tw.getTopBlocks(false)];
            topBlocks.forEach((b: any) => {
              tw.removeTopBlock(b);
              const svgRoot = b.getSvgRoot();
              if (svgRoot && svgRoot.parentNode) svgRoot.parentNode.removeChild(svgRoot);
            });
            if ((tw as any).connectionDBList) {
              (tw as any).connectionDBList.forEach((db: any) => {
                if (db) db.connections_ = [];
              });
            }
          }
          if ((tw as any).intersectionObserver) {
              (tw as any).intersectionObserver.observing = [];
          }
          // 临时屏蔽 resize，并延迟恢复，确保 onWorkspaceUpdate 调用时仍为空函数
          const origResize = tw.resize;
          tw.resize = function() {};
          setTimeout(() => {
            tw.resize = origResize;
          }, 0); // 下一个宏任务恢复，此时外部 resize 调用已结束
          restoreTargetFromOffscreen(
            newTargetId, tw, blockly, activeId,
            getBlockGroup, ALL_GROUPS_ID
          );
          window.__SKIP_TEXT_TO_DOM__ = true;
          //frame处理
          cleanupFramesAfterLoad(tw);
          setTimeout(() => refreshGroups(), 20);
          return tw;
        } catch (e) {
            console.error('[离屏缓存] 恢复失败，回退到 XML 加载', e);
        }
      }

      // 无缓存：首次加载，强制全量加载以创建完整缓存
      const originalActiveId = getActiveGroupId(newTargetId);
      setActiveGroupId(newTargetId, ALL_GROUPS_ID);

      let xmlString = typeof xml === 'string' ? xml : new XMLSerializer().serializeToString(xml);
      const doc = new DOMParser().parseFromString(xmlString, "text/xml");
      const root = doc.documentElement;
      if (!root) {
        setActiveGroupId(newTargetId, originalActiveId);
        return origClear.call(this, xml, ...args);
      }

      // 恢复分组信息
      Array.from(root.children)
        .filter(c => c.tagName.toLowerCase() === 'block')
        .forEach(n => restoreBlockGroupFromXml(n as Element, newTargetId));

      // 清理注释
      if (typeof tw.getTopComments === 'function') {
        const comments = tw.getTopComments(true);
        comments.forEach((comment: any) => {
          if (comment.dispose) comment.dispose();
        });
      } else if ((tw as any).commentDB_) {
        Object.values((tw as any).commentDB_).forEach((comment: any) => {
          if (comment.dispose) comment.dispose();
        });
      }
      const canvas = tw.getCanvas();
      if (canvas) {
        const commentElements = canvas.querySelectorAll('.scratchCommentTopBar, .blocklyComment');
        commentElements.forEach((el: Element) => el.remove());
      }

      // 这个加载并非多余的，它会在如第一次导入角色时强制一次刷新，来避免一些首次加载会出现的问题。
      try {
        origClear.call(this, xml, ...args);
      } finally {
        setActiveGroupId(newTargetId, originalActiveId);
      }
      cleanupFramesAfterLoad(tw);
      // 初始化离屏缓存
      try {
        initTargetCacheAndSwitchToGroup(
          newTargetId,
          tw,
          blockly,
          originalActiveId,
          getBlockGroup,
          ALL_GROUPS_ID
        );
      } catch (e) {
          if (!(window as any).__IS_COLLABORATION__) {
            console.error('[离屏缓存] 初始化失败', e);
        }  
      }
      /*
      try {
      origClear.call(this, xml, ...args);
    } finally {
      setActiveGroupId(newTargetId, originalActiveId);
    }*/
    cleanupFramesAfterLoad(tw);

    // 触发 Pixi 刷新（若已开启）
    if ((window as any).__ENABLE_PIXI_OPTIMIZATION__) {
      requestAnimationFrame(() => {
        (window as any).__PIXI_REFRESH_OVERLAY__?.();
      });
    }
      setTimeout(() => refreshGroups(), 20);
      return tw;
    };

      const handleCreate = (e: any) => {
        if (e.type !== blockly.Events.BLOCK_CREATE) return;
        const block = workspace.getBlockById(e.blockId) as any;
        if (!block || block.getParent?.()) return;
        const ct = (vm as any).editingTarget || (vm as any).runtime?._editingTarget;
        if (!ct) return;
        const activeId = getActiveGroupId(ct.id);
        requestAnimationFrame(() => {
          //const root = getRootBlock(block);理论上讲应该设置根积木的，我也不知道为什么它能跑，反正不动了
          setBlockGroup(block, activeId === ALL_GROUPS_ID ? UNGROUPED_ID : activeId, ct.id);
          if ((window as any).__IS_COLLABORATION__ && activeId !== ALL_GROUPS_ID) {
            const group = getBlockGroup(block);
            if (group !== activeId) {
              workspace.removeTopBlock(block);
              block.dispose(false, false);
            }
          }
        });
      };
    workspace.addChangeListener(handleCreate);

    const ContextMenu = (window as any).Blockly.ContextMenu;
    let menuId: string | null = null;
    if (ContextMenu && typeof ContextMenu.addDynamicMenuItem === 'function') {
      menuId = ContextMenu.addDynamicMenuItem(
        (items: any[], block: any) => {
          if (!block || block.workspace.isFlyout) return items;
          const ct = (vm as any).editingTarget || (vm as any).runtime?._editingTarget;
          if (!ct) return items;
          const targetId = ct.id;
          const allGroups = getGroups(targetId);
          if (!allGroups.length) return items;
          
          const root = getRootBlock(block);
          const cur = getBlockGroup(root);
          
          items.push({ separator: true });
          
          allGroups.forEach(g => {
            items.push({
              text: msg('plugins.editorOptimization.moveToGroup')+`「${g.name}」${g.id === cur ? ' ✓' : ''}`,
              enabled: g.id !== cur,
              callback: () => {
                try {
                  setBlockGroup(root, g.id, targetId);
                  if (getActiveGroupId(targetId) !== ALL_GROUPS_ID && getActiveGroupId(targetId) !== g.id) {
                  const offscreenWs = getOffscreenWorkspace(targetId);
                  if (offscreenWs) {
                    try {
                      moveBlockTreeToWorkspace(root, workspace, offscreenWs, blockly);
                      workspace.recordCachedAreas?.();
                      workspace.resizeContents?.();
                    } catch (e) {
                      const hideBlockStack = (block: any) => {
                        if (!block) return;
                        if (block.getSvgRoot) {
                          const rootSvg = block.getSvgRoot();
                          if (rootSvg) rootSvg.style.display = 'none';
                        }
                        const children = block.getChildren(false);
                        children.forEach((child: any) => hideBlockStack(child));
                      };
                      hideBlockStack(root);
                    }
                  } else {
                    const hideBlockStack = (block: any) => {
                      if (!block) return;
                      if (block.getSvgRoot) {
                        const rootSvg = block.getSvgRoot();
                        if (rootSvg) rootSvg.style.display = 'none';
                      }
                      const children = block.getChildren(false);
                      children.forEach((child: any) => hideBlockStack(child));
                    };
                    hideBlockStack(root);
                  }
                }
                  toast.success(msg('plugins.editorOptimization.groupMoveSuccess')+`「${g.name}」`);
                } catch (e) {
                }
              }
            });
          });
          
          return items;
        },
        { targetNames: ['blocks', 'frame'] }
      );
    }

    return () => {
      if (origClear) blockly.Xml.clearWorkspaceAndLoadFromXml = origClear;
      workspace.removeChangeListener(handleCreate);
      if (menuId && ContextMenu && typeof ContextMenu.deleteDynamicMenuItem === 'function') {
        ContextMenu.deleteDynamicMenuItem(menuId);
      }
      if (origDomToWorkspace) blockly.Xml.domToWorkspace = origDomToWorkspace;
    };
  }, [blockly, workspace, vm, refreshGroups]);
  //阻止注释生成。这应该比原本的方法更高效。
  React.useEffect(() => {
    if (!blockly) return;

    const BlockSvg = blockly.BlockSvg.prototype;
    const origSetCommentText = BlockSvg.setCommentText;

    BlockSvg.setCommentText = function (text: string) {
      // 调用原始方法，保证注释对象完整
      origSetCommentText.call(this, text);

      // 首次创建时即隐藏，并阻止后续显示
      if (this.comment && !this.comment.__hiddenByPlugin) {
        this.comment.__hiddenByPlugin = true;

        // 隐藏图标组
        if (this.comment.iconGroup_) {
            // 使用 visibility 隐藏但保留布局空间
            this.comment.iconGroup_.style.visibility = 'hidden';
            this.comment.iconGroup_.style.pointerEvents = 'none';
        }

        // 立即关闭气泡（若有）
        if (this.comment.isVisible()) {
          this.comment.setVisible(false);
        }

        // 劫持 setVisible，永远禁止打开
        const origSetVisible = this.comment.setVisible;
        this.comment.setVisible = function (visible: boolean) {
          if (visible) return; // 阻止显示
          return origSetVisible.call(this, false);
        };
      }
    };

    return () => {
      BlockSvg.setCommentText = origSetCommentText;
    };
  }, [blockly]);
  //为了推迟新建的积木到enddrag之后，因此需要一些状态描述。
React.useEffect(() => {
  if (!blockly) return;
  const Gesture = (blockly as any).Gesture?.prototype;
  const BlockDragger = (blockly as any).BlockDragger?.prototype;
  if (!Gesture || !BlockDragger) return;

  const origStartDraggingBlock = Gesture.startDraggingBlock_;
  const origEndBlockDrag = BlockDragger.endBlockDrag;

  Gesture.startDraggingBlock_ = function () {
    lockCommentWrite(true);
    // 拖拽开始时清除该积木树的 Pixi 纹理
    const block = this.block_ || this.block;
    if (block && pixiRendererRef.current) {
      const root = block.getRootBlock();
      if (root) {
        pixiRendererRef.current.clearPixiForRoot(root);
      }
    }
    return origStartDraggingBlock.call(this);
  };

  BlockDragger.endBlockDrag = function (...args: any[]) {
    const result = origEndBlockDrag.apply(this, args);
    lockCommentWrite(false);
    return result;
  };

  return () => {
    Gesture.startDraggingBlock_ = origStartDraggingBlock;
    BlockDragger.endBlockDrag = origEndBlockDrag;
  };
}, [blockly]);
  // 切出优化-快速清理-Flyout修复
  React.useEffect(() => {
    if (!blockly || !workspace) return;
    // 修复 Flyout 变量字段序列化异常
    const origFieldToDomVariable = blockly.Xml?.fieldToDomVariable_;
    if (origFieldToDomVariable) {
      blockly.Xml.fieldToDomVariable_ = function(field: any) {
        // 如果变量不存在，返回 null 表示跳过此字段，而不是抛出错误
        if (!field.getVariable()) {
          console.warn('[editor-optimization] Skipping variable field with no variable:', field.name);
          //这是某种Flyout流程的固有缺陷，editor-optimization并没有直接产生任何非法的variable field，此问题可能源于插件hack导致的加载时序问题，并且问题可能是偶发的。
          return null;
        }
        return origFieldToDomVariable.call(this, field);
      };
    }
    const BlocklyAny = blockly as any;
    const WorkspaceSvg = BlocklyAny.WorkspaceSvg?.prototype ? BlocklyAny.WorkspaceSvg : workspace.constructor;
    const BlockSvg = BlocklyAny.BlockSvg?.prototype ? BlocklyAny.BlockSvg : (workspace.newBlock('') as any).constructor;

    if (!window.__ORIGINAL_CLEAR_WS_SVG__) {
      window.__ORIGINAL_CLEAR_WS_SVG__ = WorkspaceSvg.prototype.clear;
    }
    if (!window.__ORIGINAL_DISPOSE_SVG__) {
      window.__ORIGINAL_DISPOSE_SVG__ = BlockSvg.prototype.dispose;
    }

    const origClear = window.__ORIGINAL_CLEAR_WS_SVG__;
    const origDispose = window.__ORIGINAL_DISPOSE_SVG__;

    const utils = BlocklyAny.utils;
    let origRemoveClass: any = null;
    if (utils && utils.removeClass) {
      origRemoveClass = utils.removeClass;
      utils.removeClass = function(element: any, className: string) {
        if (!element) return;
        return origRemoveClass.call(this, element, className);
      };
    }

    BlockSvg.prototype.dispose = function(healStack?: boolean, animate?: boolean) {
      if (window.__FAST_CLEAR_MODE__) {
        const svgGroup = this.svgGroup_;
        this.svgGroup_ = null;
        try {
          return origDispose.call(this, healStack, animate);
        } finally {
          this.svgGroup_ = svgGroup;
        }
      } else {
        return origDispose.call(this, healStack, animate);
      }
    };

    const Connection = BlocklyAny.Connection?.prototype ? BlocklyAny.Connection : (workspace.newBlock('')?.getConnections_(true)?.[0]?.constructor);
    let origConnectionDispose: any = null;
    if (Connection && Connection.prototype.dispose) {
      origConnectionDispose = Connection.prototype.dispose;
      Connection.prototype.dispose = function() {
        if (window.__FAST_CLEAR_MODE__) {
          if (this.sourceBlock_) {
            const connections = this.sourceBlock_.getConnections_(true);
            const idx = connections.indexOf(this);
            if (idx !== -1) connections.splice(idx, 1);
          }
          this.sourceBlock_ = null;
          this.targetConnection = null;
          this.targetBlock_ = null;
          this.connectionDB_ = null;
        } else {
          return origConnectionDispose.call(this);
        }
      };
    }

    const Field = BlocklyAny.Field?.prototype ? BlocklyAny.Field : (() => {
      const dummyBlock = workspace.newBlock('') as any;
      const input = dummyBlock?.inputList?.[0];
      const field = input?.fieldRow?.[0];
      dummyBlock?.dispose(false, false);
      return field?.constructor;
    })();
    let origFieldDispose: any = null;
    if (Field && Field.prototype.dispose) {
      origFieldDispose = Field.prototype.dispose;
      Field.prototype.dispose = function() {
        if (window.__FAST_CLEAR_MODE__) {
          if (this.fieldGroup_) this.fieldGroup_ = null;
          this.sourceBlock_ = null;
          this.workspace_ = null;
          this.validator_ = null;
          this.callback_ = null;
          this.textElement_ = null;
          this.borderRect_ = null;
        } else {
          return origFieldDispose.call(this);
        }
      };
    }

    const Input = BlocklyAny.Input?.prototype ? BlocklyAny.Input : (() => {
      const dummyBlock = workspace.newBlock('') as any;
      const input = dummyBlock?.inputList?.[0];
      dummyBlock?.dispose(false, false);
      return input?.constructor;
    })();
    let origInputDispose: any = null;
    if (Input && Input.prototype.dispose) {
      origInputDispose = Input.prototype.dispose;
      Input.prototype.dispose = function() {
        if (window.__FAST_CLEAR_MODE__) {
          if (this.fieldGroup_) this.fieldGroup_ = null;
          if (this.fieldRow) {
            for (let i = 0; i < this.fieldRow.length; i++) {
              const field = this.fieldRow[i];
              if (field && field.dispose) field.dispose();
            }
            this.fieldRow.length = 0;
          }
          this.sourceBlock_ = null;
          this.connection = null;
        } else {
          return origInputDispose.call(this);
        }
      };
    }

    WorkspaceSvg.prototype.clear = function() {
      const enabled = window.__EDITOR_OPT_FAST_CLEAR_ENABLED__;
      if (!enabled) {
        return origClear.call(this);
      }

      const workspaceSvg = this as any;
      const canvas = workspaceSvg.getCanvas();
      if (!canvas) return origClear.call(this);

      const topBlocks = workspaceSvg.getTopBlocks(true) as any[];

      while (canvas.firstChild) {
        canvas.removeChild(canvas.firstChild);
      }

      window.__FAST_CLEAR_MODE__ = true;
      try {
        if (BlocklyAny.Events) BlocklyAny.Events.disable();
        try {
          workspaceSvg.blockDB_ = Object.create(null);
          workspaceSvg.topBlocks_ = [];
          if (workspaceSvg.commentDB_) {
            workspaceSvg.commentDB_ = Object.create(null);
          }
          const dbList = workspaceSvg.connectionDBList;
          if (dbList) {
            for (let i = 0; i < dbList.length; i++) {
              if (dbList[i]) {
                dbList[i].connections_ = [];
              }
            }
          }
        } finally {
          if (BlocklyAny.Events) BlocklyAny.Events.enable();
        }
      } finally {
        window.__FAST_CLEAR_MODE__ = false;
      }
    };

    return () => {
      WorkspaceSvg.prototype.clear = window.__ORIGINAL_CLEAR_WS_SVG__;
      BlockSvg.prototype.dispose = window.__ORIGINAL_DISPOSE_SVG__;
      if (Connection && origConnectionDispose) Connection.prototype.dispose = origConnectionDispose;
      if (Field && origFieldDispose) Field.prototype.dispose = origFieldDispose;
      if (Input && origInputDispose) Input.prototype.dispose = origInputDispose;
      if (utils && origRemoveClass) utils.removeClass = origRemoveClass;
      blockly.Xml.fieldToDomVariable_ = origFieldToDomVariable;
    };
  }, [blockly, workspace]);

  // 性能测量与序列化过滤
  /*
  React.useEffect(() => {
    if (!vm) return;
    const originalSetEditingTarget = (vm as any).setEditingTarget;
    const originalEmitWorkspaceUpdate = (vm as any).emitWorkspaceUpdate;

    if (originalEmitWorkspaceUpdate) {
      (vm as any).emitWorkspaceUpdate = function() {
        window.__FILTER_TOP_BLOCKS_FOR_SERIALIZATION__ = true;
        try {
          return originalEmitWorkspaceUpdate.call(this);
        } finally {
          window.__FILTER_TOP_BLOCKS_FOR_SERIALIZATION__ = false;
        }
      };
    }

    return () => {
      if (originalSetEditingTarget) {
        (vm as any).setEditingTarget = originalSetEditingTarget;
      }
      if (originalEmitWorkspaceUpdate) {
        (vm as any).emitWorkspaceUpdate = originalEmitWorkspaceUpdate;
      }
    };
  }, [vm]);*/

  // 优化：字段初始化延迟 + rAF 同步
  /*
  React.useEffect(() => {
    if (!blockly || !workspace) return;

    const BlocklyAny = blockly as any;
    const FieldLabel = BlocklyAny.FieldLabel?.prototype;
    const origFieldLabelInit = FieldLabel?.init;

    const origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback: FrameRequestCallback): number {
      if (window.__SKIP_LAYOUT_UPDATE__) {
        callback(performance.now());
        return 0;
      }
      return origRAF.call(window, callback);
    };

    return () => {
      window.requestAnimationFrame = origRAF;
    };
  }, [blockly, workspace]);*/

  // 注释处理：修复重复显示问题 。已经过时。
  /*
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `g.scratchCommentTopBar { display: none !important; }`;
    document.head.appendChild(style);

    let shownContainers = new WeakSet<Element>();

    const isGroupComment = (container: Element): boolean => {
      const blockSvg = container.closest('g.blocklyDraggable');
      const blockId = blockSvg?.getAttribute('data-id') || blockSvg?.id;
      if (blockId) {
        const groupId = getBlockGroup({ id: blockId });
        if (groupId !== ALL_GROUPS_ID) return true;
      }
      const textarea = container.querySelector('textarea.scratchCommentTextarea') as HTMLTextAreaElement | null;
      return textarea ? textarea.value.includes('__|EdiOpt|') : false;
    };

    const showNormalComments = () => {
      let comments: any[] = [];
      if (typeof (workspace as any).getTopComments === 'function') {
        comments = (workspace as any).getTopComments(true);
      } else if ((workspace as any).commentDB_) {
        comments = Object.values((workspace as any).commentDB_);
      } else {
        const canvas = workspace.getCanvas();
        if (!canvas) return;
        const containers = canvas.querySelectorAll('g:has(.scratchCommentTopBar)');
        containers.forEach((container: Element) => {
          if (container.closest('.blocklyContextMenu')) return;
          if (shownContainers.has(container)) return;
          if (isGroupComment(container)) {
            shownContainers.add(container);
            return;
          }
          (container as HTMLElement).style.setProperty('display', 'block', 'important');
          container.classList.add('gandi-normal-comment');
          shownContainers.add(container);
        });
        return;
      }

      comments.forEach((comment: any) => {
        const root = comment.svgGroup_ || comment.getSvgRoot?.();
        if (!root) return;
        if (root.closest?.('.blocklyContextMenu')) return;
        if (shownContainers.has(root)) return;
        if (isGroupComment(root)) {
          shownContainers.add(root);
          return;
        }
        root.style.setProperty('display', 'block', 'important');
        root.classList.add('gandi-normal-comment');
        shownContainers.add(root);
      });
    };

    const observer = new MutationObserver(() => {
      setTimeout(showNormalComments, 20);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(showNormalComments, 200);
    const interval = setInterval(showNormalComments, 500);

    return () => {
      document.head.removeChild(style);
      observer.disconnect();
      clearInterval(interval);
      const canvas = workspace.getCanvas();
      if (canvas) {
        const comments = canvas.querySelectorAll('.gandi-normal-comment');
        comments.forEach((el) => el.classList.remove('gandi-normal-comment'));
      }
    };
  }, [workspace]);
*/
  // 全屏优化
  React.useEffect(() => {
    if (!vm || !workspace) return;
    const runtime = (vm as any).runtime;
    if (!runtime) return;

    const renderer = runtime.renderer;
    if (!renderer) {
      return;
    }

    const RenderWebGLProto = Object.getPrototypeOf(renderer);
    if (!RenderWebGLProto || !RenderWebGLProto.resize) {
      return;
    }

    const origResize = RenderWebGLProto.resize;
    const injectionDiv = workspace.getInjectionDiv();

    RenderWebGLProto.resize = function(pixelsWide: number, pixelsTall: number) {
      const { canvas } = this._gl;
      if (window.__ENABLE_FULLSCREEN_OPTIMIZATION__){
        const isEnteringFullscreen = pixelsTall > canvas.height;
        const isExitingFullscreen = pixelsTall <= canvas.height;
        
        if (isEnteringFullscreen && !window.__IN_FULLSCREEN_MODE__) {
          window.__IN_FULLSCREEN_MODE__ = true;
          if (injectionDiv) { 
            (injectionDiv as any).style.display = 'none';
          }
          if ((Blockly as any).Events) {
            (Blockly as any).Events.disable();
          }
        } else if (isExitingFullscreen && window.__IN_FULLSCREEN_MODE__) {
          window.__IN_FULLSCREEN_MODE__ = false;
          if (injectionDiv) {
            (injectionDiv as any).style.display = '';
          }
          if ((Blockly as any).Events) {
            (Blockly as any).Events.enable();
          }
          workspace.recordCachedAreas?.();
          workspace.resize?.();
        }
      }

      return origResize.call(this, pixelsWide, pixelsTall);
    };

    return () => {
      RenderWebGLProto.resize = origResize;
      window.__IN_FULLSCREEN_MODE__ = false;
      if (injectionDiv) (injectionDiv as any).style.display = '';
      if ((Blockly as any).Events) (Blockly as any).Events.enable();
    };
  }, [vm, workspace]);

  // frame处理方法
  function cleanupFramesAfterLoad(ws: any) {
    if (!ws) return;
    const frames = ws.getTopFrames?.(false) || [];
    frames.forEach((f: any) => {
      if (f.frameGroup_) {
        f.frameGroup_.remove();
      }
    });
    const allBlocks = ws.getAllBlocks(false) as any[];
    allBlocks.forEach((b: any) => {
      if (b.frame_) {
        b.frame_ = null;
        const svgRoot = b.getSvgRoot();
        if (svgRoot && svgRoot.parentNode !== ws.getCanvas()) {
          ws.getCanvas().appendChild(svgRoot);
        }
      }
    });
    if (ws.topFrames_) ws.topFrames_ = [];
    if (ws.frameDB_) ws.frameDB_ = Object.create(null);

    const topBlocks = ws.getTopBlocks(false);
    if (ws.intersectionObserver) {
      topBlocks.forEach((b: any) => {
        if (!ws.intersectionObserver.observing.includes(b)) {
          ws.intersectionObserver.observe(b);
        }
      });
      ws.intersectionObserver.checkForIntersections();
    }
  }

  // Frame 完全禁用
  React.useEffect(() => {
    if (!blockly || !workspace) return;

    const workspaceProto = Object.getPrototypeOf(workspace);

    const origDomToFrame = blockly.Xml?.domToFrame;
    if (origDomToFrame) {
      blockly.Xml.domToFrame = function () {
        return null;
      };
    }

    const origCreateFrame = workspaceProto.createFrame;
    if (origCreateFrame) {
      workspaceProto.createFrame = function () {
        return null;
      };
    }

    const origSetWaitingCreateFrame = workspaceProto.setWaitingCreateFrameEnabled;
    if (origSetWaitingCreateFrame) {
      workspaceProto.setWaitingCreateFrameEnabled = function (_visible: boolean) {};
    }

    cleanupFramesAfterLoad(workspace);

    return () => {
      if (origDomToFrame) blockly.Xml.domToFrame = origDomToFrame;
      if (origCreateFrame) workspaceProto.createFrame = origCreateFrame;
      if (origSetWaitingCreateFrame) workspaceProto.setWaitingCreateFrameEnabled = origSetWaitingCreateFrame;
    };
  }, [blockly, workspace]);

const workerRef = useRef<Worker | null>(null);

  //重构后的Pixi渲染器useEffect
React.useEffect(() => {
  if (!pixiEnabled || !blockly || !workspace || !vm) {
    // 清理旧渲染器
    if (pixiRendererRef.current) {
      pixiRendererRef.current.destroy();
      pixiRendererRef.current = null;
    }
    return;
  }

  const workspaceDiv = workspace.getParentSvg()?.parentElement as HTMLElement;
  if (!workspaceDiv) return;

  // 创建 Pixi wrapper
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";
  workspaceDiv.style.position = "relative";
  workspaceDiv.appendChild(wrapper);
  // 创建调试面板
  const debugPanel = document.createElement('div');
  debugPanel.style.cssText = `
    position: absolute;
    bottom: 4px;
    left: 332px;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    font-family: monospace;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    z-index: 9999;
    pointer-events: auto;
    line-height: 1.4;
    cursor: move;
    user-select: none;
  `;
  wrapper.appendChild(debugPanel);

  // 拖拽逻辑
  let dragging = false;
  let offsetX = 0, offsetY = 0;
  let useTop = false; // 是否已切换为 top 定位

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    const rect = debugPanel.getBoundingClientRect();
    offsetX = e.clientX - rect.left + 72;
    offsetY = e.clientY - rect.top + 60;
    // 首次拖动时，从 bottom 定位切换为 top 定位，保持当前位置不变
    if (!useTop) {
      debugPanel.style.bottom = '';
      debugPanel.style.top = rect.top + 'px';
      debugPanel.style.left = rect.left + 'px';
      useTop = true;
    }
    debugPanel.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    debugPanel.style.left = (e.clientX - offsetX) + 'px';
    debugPanel.style.top = (e.clientY - offsetY) + 'px';
    e.stopPropagation();
  };

  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    debugPanel.releasePointerCapture(e.pointerId);
    e.stopPropagation();
  };

  debugPanel.addEventListener('pointerdown', onPointerDown);
  debugPanel.addEventListener('pointermove', onPointerMove);
  debugPanel.addEventListener('pointerup', onPointerUp);
  // 初始化渲染器
  const renderer = new PixiBlockRenderer(wrapper, workspace, blockly, vm);
  renderer.onRestoreDOM = (rootId: string) => {
    const rootBlock = workspace.getBlockById(rootId);
    if (rootBlock) renderer.clearPixiForRoot(rootBlock);
  };
  const handleDoubleClick = (e: MouseEvent) => {
    if (ignoreNextDoubleClick) return;
    const rootId = renderer.currentHoveredRootId ?? renderer.getChunkAt(e.clientX, e.clientY);
    if (rootId) {
      const rootBlock = workspace.getBlockById(rootId);
      if (rootBlock) {
        renderer.clearPixiForRoot(rootBlock);
        renderer.markDOMOnly(rootId);
      }
    }
  };
workspaceDiv.addEventListener('dblclick', handleDoubleClick);

  pixiRendererRef.current = renderer;
  renderer.init().then(() => {
    const ContextMenu = (window as any).Blockly.ContextMenu;
    let menuItemId: string | null = null;
    if (ContextMenu && typeof ContextMenu.addDynamicMenuItem === 'function') {
      menuItemId = ContextMenu.addDynamicMenuItem(
        (items: any[], block: any) => {
          if (!block || block.workspace.isFlyout) return items;
          items.push({ separator: true });
          items.push({
            text: msg('plugins.editorOptimization.switchToPixi'),
            enabled: true,
            callback: () => {
              const root = block.getRootBlock();
              if (root) renderer.switchToPixi(root);
            }
          });
          return items;
        },
        { targetNames: ['blocks', 'frame'] }
      );
    }
    renderer.syncView();
    renderer.fullRefresh((vm as any).editingTarget?.id);
  });
    const debugInterval = setInterval(() => {
      if (!pixiRendererRef.current) return;
      const info = pixiRendererRef.current.getDebugInfo();
      debugPanel.textContent = `FPS: ${Math.round(info.fps)} | Active Sprites: ${info.spriteCount}`;
    }, 500);
  // ---------- 保存原始方法 ----------
  const BlocklyAny = blockly as any;
  const WorkspaceDragger = BlocklyAny.WorkspaceDragger?.prototype;
  const ScrollbarPair = BlocklyAny.ScrollbarPair?.prototype;
  const BlockDragger = BlocklyAny.BlockDragger?.prototype;
  const BlockSvgProto = blockly.BlockSvg.prototype;
  const BlocklyXml = BlocklyAny.Xml;
  const InsertionMarkerManager = BlocklyAny.InsertionMarkerManager;
  const Connection = BlocklyAny.Connection?.prototype;

  const originalDrag = WorkspaceDragger?.drag;
  const originalSetScale = workspace.setScale.bind(workspace);
  const originalScrollSet = ScrollbarPair?.set;
  const originalEndDrag = BlockDragger?.endBlockDrag;
  const originalUpdateIntersectionObserver = BlockSvgProto.updateIntersectionObserver;
  const originalDomToBlock = BlocklyXml?.domToBlock;
  const originalSetEditingTarget = vm.setEditingTarget.bind(vm);
  const originalConnect_ = Connection?.connect_;
  const originalDisconnectInternal_ = Connection?.disconnectInternal_;
  let originalConnectMarker: any = null;
  let originalDisconnectMarker: any = null;
  let ignoreNextDoubleClick = false;

  // ---------- 劫持工作区方法 ----------
  if (WorkspaceDragger && originalDrag) {
    WorkspaceDragger.drag = function (d: any) {
      renderer.pauseInteractions();
      originalDrag.call(this, d);
      //renderer.syncView();
    };
  }

  workspace.setScale = function (s: number) {
    const hiddenBlocks: any[] = [];
    const allBlocks = workspace.getAllBlocks(false);
    for (const block of allBlocks) {
      if (block.svgGroup_ && block.svgGroup_.style.display === 'none') {
        hiddenBlocks.push(block);
        (block.svgGroup_.style as any).contentVisibility = 'hidden';
      }
    }
    originalSetScale(s);
    renderer.syncView();

    ignoreNextDoubleClick = true;
    // 防止双击事件穿透
    clearTimeout((window as any).__ignoreDblClickTimer);
    (window as any).__ignoreDblClickTimer = setTimeout(() => {
      ignoreNextDoubleClick = false;
    }, 300);
  };

  if (ScrollbarPair && originalScrollSet) {
    ScrollbarPair.set = function (x: number, y: number) {
      originalScrollSet.call(this, x, y);
      renderer.syncView();
    };
  }

  if (BlockDragger && originalEndDrag) {
    BlockDragger.endBlockDrag = function (e: Event, delta: any, checkFn?: Function) {
      renderer.resumeInteractions();
      originalEndDrag.call(this, e, delta, checkFn);
      //const root = this.draggingBlock_?.getRootBlock();
      //if (root) renderer.markDirty(root);
    };
  }

  if (originalUpdateIntersectionObserver) {
    BlockSvgProto.updateIntersectionObserver = function () {
      // 在 Pixi 模式下禁用离屏观察，所有块都视为可见（但渲染器自己裁剪）
      const block = this as any;
      if (block.workspace?.intersectionObserver) {
        block.workspace.intersectionObserver.unobserve(block);
        if (block.intersects_ === false) {
          block.intersects_ = true;
        }
      }
    };
  }
/*
  if (BlocklyXml && originalDomToBlock) {
    BlocklyXml.domToBlock = function (xmlBlock: Element, targetWorkspace: any) {
      const result = originalDomToBlock.call(this, xmlBlock, targetWorkspace);
      
      // 新块加入后标记脏区
      if (result) {
        const root = result.getRootBlock?.() || result;
        if (root.workspace === workspace) renderer.markDirty(root);
      }
      return result;
    };
  }
*/
  // 插入标记管理器：连接/断开前恢复 DOM
  if (InsertionMarkerManager) {
    originalConnectMarker = InsertionMarkerManager.prototype.connectMarker_;
    originalDisconnectMarker = InsertionMarkerManager.prototype.disconnectMarker_;
    InsertionMarkerManager.prototype.connectMarker_ = function () {
      originalConnectMarker.call(this);
      const closestConn = (this as any).closestConnection_;
      if (closestConn) {
        const targetBlock = closestConn.sourceBlock_;
        if (targetBlock && targetBlock.workspace === workspace) {
          renderer.clearPixiForRoot(targetBlock.getRootBlock());
        }
      }
    };
    InsertionMarkerManager.prototype.disconnectMarker_ = function () {
      const closestConn = (this as any).closestConnection_;
      if (closestConn) {
        const targetBlock = closestConn.sourceBlock_;
        if (targetBlock && targetBlock.workspace === workspace) {
          renderer.clearPixiForRoot(targetBlock.getRootBlock());
        }
      }
      originalDisconnectMarker.call(this);
    };
  }

  // 连接操作：恢复相关的积木 DOM
  if (Connection) {
    Connection.connect_ = function (childConnection: any) {
      const childBlock = childConnection.sourceBlock_;
      const oldRoot = childBlock ? childBlock.getRootBlock() : null;
      originalConnect_.call(this, childConnection);
      renderer.clearPixiForRoot(this.sourceBlock_.getRootBlock());
      if (oldRoot && oldRoot !== this.sourceBlock_.getRootBlock()) {
        renderer.clearPixiForRoot(oldRoot); // 旧树也清除
      }
    };
    Connection.disconnectInternal_ = function (parentBlock: any, childBlock: any) {
      originalDisconnectInternal_.call(this, parentBlock, childBlock);
      renderer.clearPixiForRoot(parentBlock.getRootBlock());
      renderer.clearPixiForRoot(childBlock.getRootBlock());
    };
  }

  vm.setEditingTarget = function (targetId: string) {
    const isCollab = !!(window as any).__IS_COLLABORATION__;
    renderer.cancelBake();
    const result = originalSetEditingTarget(targetId);
    //延迟刷新
    requestAnimationFrame(() => {
      renderer.fullRefresh(targetId, isCollab);
    });
    
    return result;
  };

  // 外部刷新钩子
  (window as any).__PIXI_REFRESH_OVERLAY__ = () => {
    renderer.syncView();
    renderer.fullRefresh();
  };

  // ---------- 清理 ----------
  return () => {
    clearTimeout((window as any).__ignoreDblClickTimer);
    debugPanel.removeEventListener('pointerdown', onPointerDown);
    debugPanel.removeEventListener('pointermove', onPointerMove);
    debugPanel.removeEventListener('pointerup', onPointerUp);
    clearInterval(debugInterval);
    if (WorkspaceDragger) WorkspaceDragger.drag = originalDrag;
    workspace.setScale = originalSetScale;
    workspaceDiv.removeEventListener('dblclick', handleDoubleClick);
    if (ScrollbarPair) ScrollbarPair.set = originalScrollSet;
    if (BlockDragger) BlockDragger.endBlockDrag = originalEndDrag;
    if (originalUpdateIntersectionObserver) {
      BlockSvgProto.updateIntersectionObserver = originalUpdateIntersectionObserver;
    }
    if (BlocklyXml) BlocklyXml.domToBlock = originalDomToBlock;
    if (InsertionMarkerManager) {
      InsertionMarkerManager.prototype.connectMarker_ = originalConnectMarker;
      InsertionMarkerManager.prototype.disconnectMarker_ = originalDisconnectMarker;
    }
    if (Connection) {
      Connection.connect_ = originalConnect_;
      Connection.disconnectInternal_ = originalDisconnectInternal_;
    }
    vm.setEditingTarget = originalSetEditingTarget;
    
    //workspaceDiv.removeEventListener("dblclick", handleDoubleClick, true);
    delete (window as any).__PIXI_REFRESH_OVERLAY__;

    // 恢复所有被隐藏的积木 DOM
    const allBlocks = workspace.getAllBlocks(false);
    for (const block of allBlocks) {
      if (block.svgGroup_) {
        (block.svgGroup_.style as any).contentVisibility = "";
        block.svgGroup_.style.display = "";
      }
    }
    //如果关掉了Pixi渲染，就恢复观察
    const topBlocks = workspace.getTopBlocks(false);
    const observer = (workspace as any).intersectionObserver;
    if (observer) {
      topBlocks.forEach((b: any) => {
        if (!observer.observing.includes(b)) observer.observe(b);
      });
      observer.checkForIntersections();
    }
    renderer.destroy();
    pixiRendererRef.current = null;
  };
}, [pixiEnabled, blockly, workspace, vm]);
  //此useEffect用于修复一个小Bug：首次加载插件时，立即切换角色会把当前角色的积木工作区里所有元素（包括注释）全部错误地滞留到目标角色。
  //解决方案就是初始化加载时执行一次分组切换来初始化状态。
  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (targetId && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // 模拟一次“全部显示”分组切换，初始化内部状态
      handleSelectGroup(ALL_GROUPS_ID);
    }
  }, [targetId]);
  // ========== 原有分组 UI 保持不变 ==========
  const portal = document.querySelector('.plugins-wrapper');
  if (!portal) return null;

  return (
    <>
      {ReactDOM.createPortal(
        <Tooltip className={styles.icon} icon={<GroupIcon />} onClick={handleClick} tipText="积木分组" />,
        portal
      )}
      {visible &&
        ReactDOM.createPortal(
          <ExpansionBox
            title={msg('plugins.editorOptimization.panelTitle')}
            id="block-groups"
            minWidth={229}
            minHeight={360}
            borderRadius={8}
            stayOnTop
            onClose={() => setVisible(false)}
            containerInfo={containerInfo}
          >
            {/* UI 内容保持不变 */}
            <Box className={styles.container}>
              <div
                className={`${styles.listItem} ${activeGroupId === ALL_GROUPS_ID ? styles.active : ''}`}
                onClick={() => handleSelectGroup(ALL_GROUPS_ID)}
              >
                <span className={styles.itemText}>{msg('plugins.editorOptimization.allGroups')}</span>
                {activeGroupId === ALL_GROUPS_ID && <CheckIcon />}
              </div>
              <div className={styles.divider} />
              <div className={styles.groupList}>
                {groups.map(g => (
                  <div key={g.id} className={`${styles.listItem} ${activeGroupId === g.id ? styles.active : ''}`}>
                    <div className={styles.groupName} onClick={() => handleSelectGroup(g.id)}>
                      {editingGroupId === g.id ? (
                        <Input
                          value={editingName}
                          onChange={(e: any) => setEditingName(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e: any) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          onClick={(e: any) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={styles.groupNameText} onDoubleClick={() => startEdit(g.id, g.name)}>
                          {g.name}
                        </span>
                      )}
                      {activeGroupId === g.id && <CheckIcon />}
                    </div>
                    <IconButton size="sm" onClick={() => handleDeleteGroup(g.id)} disabled={g.id === UNGROUPED_ID}>
                      <DeleteIcon />
                    </IconButton>
                  </div>
                ))}
              </div>
              <div className={styles.addGroup}>
                <div className={styles.addGroupRow}>
                  <Input
                    placeholder={msg('plugins.editorOptimization.newGroupPlaceholder')}
                    value={newGroupName}
                    onChange={(e: any) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className={styles.addGroupRow}>
                  <button className={styles.addButton} onClick={handleAddGroup}>
                    <AddIcon />{msg('plugins.editorOptimization.newGroup')}
                  </button>
                  <button
                    className={styles.addButton}
                    onClick={async () => {
                      if (!targetId) return;
                      try {
                        disposeOffscreenCache(targetId);
                        toast.success(msg('plugins.editorOptimization.cacheResetSuccess'));
                      } catch (e) {
                        toast.error(msg('plugins.editorOptimization.cacheResetFail'));
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                      <path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    {msg('plugins.editorOptimization.resetCache')}
                  </button>
                </div>
              </div>
            </Box>
          </ExpansionBox>,
          document.body
        )}
    </>
  );
};

EditorOptimization.displayName = "EditorOptimization";
export default EditorOptimization;