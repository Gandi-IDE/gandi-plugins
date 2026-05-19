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
  setGlobalVM, ALL_GROUPS_ID, UNGROUPED_ID
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

const EditorOptimization: React.FC<PluginContext> = ({ vm, blockly, workspace, registerSettings }) => {
  const [visible, setVisible] = React.useState(false);
  const [targetId, setTargetId] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<any[]>([]);
  const [activeGroupId, setActiveGroupIdState] = React.useState<string>(ALL_GROUPS_ID);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [containerInfo, setContainerInfo] = React.useState<ExpansionRect>(DEFAULT_CONTAINER_INFO);
  const containerInfoRef = React.useRef(containerInfo);
  
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
          //console.log('__PIXI_REFRESH_OVERLAY__')
          });
      }
    if (getOffscreenWorkspace(targetId)) {
      try {
        switchGroup(targetId, groupId, workspace, blockly, getBlockGroup, ALL_GROUPS_ID);
        setActiveGroupIdState(groupId);
        setActiveGroupId(targetId, groupId);
        refreshGroups();
      } catch (e) {
        console.error('离屏分组切换失败', e);
        toast.error('分组切换失败');
      }
      return;
    }
    setActiveGroupId(targetId, groupId);
    setActiveGroupIdState(groupId);
    (vm as any).emitWorkspaceUpdate?.();
  };

  const handleAddGroup = () => {
    if (!targetId) return;
    if (!newGroupName.trim()) { toast.error("请输入分组名称"); return; }
    addGroup(targetId, newGroupName.trim());
    setNewGroupName("");
    refreshGroups();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!targetId) return;
    if (groupId === UNGROUPED_ID) { toast.error("默认分组不可删除"); return; }
    deleteGroup(targetId, groupId);
    refreshGroups();
  };

  const startEdit = (id: string, name: string) => { setEditingGroupId(id); setEditingName(name); };
  const saveEdit = () => {
    if (!targetId || !editingGroupId) return;
    if (!editingName.trim()) { toast.error("名称不能为空"); return; }
    renameGroup(targetId, editingGroupId, editingName.trim());
    setEditingGroupId(null);
    setEditingName("");
    refreshGroups();
  };

  //设置注册（包含新增的 Pixi 加速选项）
  React.useEffect(() => {
    if (!registerSettings) return;
    const dispose = registerSettings(
      '积木分组&编辑器优化',
      'plugin-editor-optimization',
      [
        {
          key: 'group',
          label: '积木分组&编辑器优化',
          description: '提供角色积木分组功能，同时优化编辑器性能。默认开启角色积木区缓存，从第二次进入角色开始提升约100%-200%切换效率。注意：本插件会忽略代码框，并禁用其创建功能；目前已兼容协作，但积木区缓存会被禁用。',
          items: [
            {
              key: 'enableFastClear',
              type: 'switch',
              label: '[实验] 启用切出优化',
              description: '极大优化切出大型角色时的效率。离屏缓存已有内部切出优化，此优化仅对特定原生场景生效。',
              value: false,
              onChange: (v: boolean) => {
                window.__EDITOR_OPT_FAST_CLEAR_ENABLED__ = v;
              }
            },
            {
              key: 'enableFullscreenOptimize',
              type: 'switch',
              label: '[实验] 启用全屏优化',
              description: '在舞台全屏时隐藏积木区，减少不必要的积木区渲染开销。',
              value: false,
              onChange: (v: boolean) => {
                window.__ENABLE_FULLSCREEN_OPTIMIZATION__ = v;
              }
            },
            // 新增 Pixi 加速选项
            {
              key: 'enablePixiOptimization',
              type: 'switch',
              label: '[实验] 启用 Pixi 加速渲染',
              description: '使用 PixiJS 将积木区渲染为纹理，大幅降低 DOM 节点数并提升拖拽/缩放流畅度。Pixi纹理提供受限的交互功能，通过双击以恢复原生DOM显示。',
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
  // 因为我根本不知道协作是否有状态标识，所以我们直接检测是否存在协作特有的GUI按钮。
  if (!window.hasOwnProperty('__IS_COLLABORATION__')) {
    (window as any).__IS_COLLABORATION__ = !!document.querySelector(
      'div.gandi_teamwork-log_log-icon-btn_3XmSR'
    );
    if ((window as any).__IS_COLLABORATION__) {
      console.log('[editor-optimization]检测到是协作环境,已禁用离屏缓存。')
    }
  }
  // ========== 以下为原 EditorOptimization 的全部 useEffect（切出优化、核心劫持、全屏优化、注释处理、Frame 禁用等）保持不变 ==========
  // 核心劫持：clearWorkspaceAndLoadFromXml（集成离屏缓存）
  React.useEffect(() => {
    if (!blockly || !workspace || !vm) return;

    const origClear = blockly.Xml?.clearWorkspaceAndLoadFromXml;
    const origDom = blockly.Xml?.domToBlock;
    const origClearWs = blockly.Xml?.clearWorkspace;

    if (!origClear || !origDom) return;

    blockly.Xml.clearWorkspaceAndLoadFromXml = function(xml: any, ...args: any[]) {
      const ct = (vm as any).editingTarget || (vm as any).runtime?._editingTarget;
      if (!ct) return origClear.call(this, xml, ...args);
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
      const tw = workspace || this;

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

      try {
        origClear.call(this, xml, ...args);
      } finally {
        setActiveGroupId(newTargetId, originalActiveId);
      }
      //frame处理
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
      try {
      origClear.call(this, xml, ...args);
    } finally {
      setActiveGroupId(newTargetId, originalActiveId);
    }
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
      setBlockGroup(block, activeId === ALL_GROUPS_ID ? UNGROUPED_ID : activeId, ct.id);
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
              text: `移动到「${g.name}」${g.id === cur ? ' ✓' : ''}`,
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
                  toast.success(`已移至「${g.name}」`);
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
    };
  }, [blockly, workspace, vm, refreshGroups]);

  // 切出优化-快速清理
  React.useEffect(() => {
    if (!blockly || !workspace) return;

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

  // 注释处理：修复重复显示问题 
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

  // ========== 新增：Pixi 加速渲染 Effect ==========
  React.useEffect(() => {
    if (!pixiEnabled || !blockly || !workspace || !vm) {
      // 如果未启用或必要对象缺失，不执行任何操作
      return;
    }
    
    // 如果 Vite 配置不同，可能需要调整 URL，或者使用 worker-loader 等。确保路径正确。
    // --- 以下代码源自 OptimizationPro 插件，整合进此 effect ---
    const workspaceDiv = workspace.getParentSvg()?.parentElement as HTMLElement;
    if (!workspaceDiv) return;

    // 用于保存原始方法的引用
    const BlocklyAny = blockly as any;
    const BlockSvgProto = blockly.BlockSvg.prototype;
    const WorkspaceDragger = BlocklyAny.WorkspaceDragger?.prototype;
    const ScrollbarPair = BlocklyAny.ScrollbarPair?.prototype;
    const BlockDragger = BlocklyAny.BlockDragger?.prototype;
    const ContextMenu = (window as any).Blockly.ContextMenu;

    // 记录原始方法，以便清理时恢复
    const originalDrag = WorkspaceDragger?.drag;
    const originalSetScale = workspace.setScale.bind(workspace);
    const originalScrollSet = ScrollbarPair?.set;
    const originalEndDrag = BlockDragger?.endBlockDrag;
    const originalMoveBy = BlockSvgProto.moveBy;
    const originalUpdateIntersectionObserver = BlockSvgProto.updateIntersectionObserver;
    const originalSetEditingTarget = vm.setEditingTarget.bind(vm);
    const BlocklyXml = BlocklyAny.Xml;
    const originalDomToBlock = BlocklyXml?.domToBlock;
    const InsertionMarkerManager = BlocklyAny.InsertionMarkerManager;
    const Connection = BlocklyAny.Connection?.prototype;
    const originalConnect_ = Connection?.connect_;
    const originalDisconnectInternal_ = Connection?.disconnectInternal_;

    // 内部状态变量
    let app: PIXI.Application;
    let worldContainer: PIXI.Container;
    let initialized = false;
    let chunkCache: any[] = [];
    let rendering = false;
    let originalConnectMarker: any = null;
    let originalDisconnectMarker: any = null;
    let menuItemId: any = null;

  if (ContextMenu && typeof ContextMenu.addDynamicMenuItem === 'function') {
    menuItemId = ContextMenu.addDynamicMenuItem(
      (items: any[], block: any) => {
        if (!block || block.workspace.isFlyout) return items;
        items.push({ separator: true });
        items.push({
          text: '切换至 Pixi 渲染',
          enabled: true,
          callback: () => {
            const root = block.getRootBlock();
            if (root) refreshRootBlock(root);
          }
        });
        return items;
      },
      { targetNames: ['blocks', 'frame'] }
    );
  }
    // 辅助函数：获取最大纹理尺寸
    const getMaxTextureSize = (): number => {
      let size = 4096;
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          size = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          size = Math.min(size, 4096);
        }
      } catch (e) {
        console.warn('Failed to query MAX_TEXTURE_SIZE, using default 4096');
      }
      return size;
    };

    // 初始化 Pixi 应用
    const initPixi = async () => {
      if (initialized) return;
      app = new PIXI.Application();
      await app.init({
        resizeTo: wrapper,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgpu',
        textureGCActive: true, 
        textureGCMaxIdle: 1800, 
        textureGCCheckCountMax: 180,
      });
      wrapper.appendChild(app.canvas);
      worldContainer = new PIXI.Container();
      worldContainer.cullable = true;
      app.stage.addChild(worldContainer);
      initialized = true;
    };
    PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';

    // 视图同步
    const syncView = () => {
      if (!worldContainer) return;
      const svgCanvas = (workspace as any).svgBlockCanvas_ || workspace.getCanvas();
      if (!svgCanvas) return;
      const t = svgCanvas.getAttribute("transform");
      if (!t) return;
      const m = t.match(/translate\(([^)]+)\)\s*scale\(([^)]+)\)/);
      if (m) {
        const [tx, ty] = m[1].split(",").map(Number);
        const s = Number(m[2]);
        worldContainer.position.set(tx, ty);
        worldContainer.scale.set(s);
      }
      updateViewport();
    };

    // 深度计算
    const getDepth = (block: any): number => {
      let depth = 0;
      let b = block;
      while (b.parentBlock_) { depth++; b = b.parentBlock_; }
      return depth;
    };

    // 获取字段颜色
    const getFieldFill = (field: any): string => {
      const root = field.getSvgRoot();
      if (root) {
        const textEl = root.querySelector("text");
        if (textEl) {
          const fill = textEl.getAttribute("fill");
          if (fill) return fill;
        }
      }
      if (field instanceof blockly.FieldTextInput) return "#000000";
      return "#ffffff";
    };

    // 提取整棵树的数据（用于烘焙）
    const extractTreeBlocks = (rootBlock: any): any[] => {
      const list: any[] = [];
      const stack = [rootBlock];
      const visited = new Set<string>();
      while (stack.length > 0) {
        const block = stack.pop();
        if (!block || visited.has(block.id)) continue;
        visited.add(block.id);
        if (!block.svgPath_) continue;
        const pos = block.getRelativeToSurfaceXY();
        const pathD = block.svgPath_.getAttribute("d") || "";
        const color = (block as any).getColour();
        const stroke = (block as any).getColourTertiary();
        const fields: any[] = [];
        const inputs: any[] = [];
        for (const input of block.inputList) {
          for (const field of input.fieldRow) {
            const root = field.getSvgRoot();
            if (!root) continue;
            const transform = root.getAttribute("transform");
            let fx = 0, fy = 0;
            if (transform) {
              const m = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
              if (m) { fx = parseFloat(m[1]); fy = parseFloat(m[2]); }
            }
            const textEl = root.querySelector("text") || (root.tagName === "text" ? root : null);
            let textX = 0, textY = 0;
            let anchorX = 0, anchorY = 0;
            if (textEl) {
              textX = parseFloat(textEl.getAttribute("x") || "0");
              textY = parseFloat(textEl.getAttribute("y") || "0");
              const ta = textEl.getAttribute("text-anchor") || "start";
              if (ta === "middle") anchorX = 0.5;
              else if (ta === "end") anchorX = 1;
              const db = textEl.getAttribute("dominant-baseline") || "baseline";
              if (db === "middle") anchorY = 0.5;
              else if (db === "hanging") anchorY = 0;
            }
            const finalX = fx + textX;
            const finalY = fy + textY;
            fields.push({
              text: field.getText(),
              x: finalX, y: finalY,
              fill: getFieldFill(field),
              fontFamily: "sans-serif", fontSize: 16,
              anchorX, anchorY
            });
          }
          if (input.outlinePath && !(input.connection && input.connection.targetBlock())) {
            const op = input.outlinePath;
            const opTransform = op.getAttribute("transform") || "";
            let opX = 0, opY = 0;
            const opM = opTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (opM) { opX = parseFloat(opM[1]); opY = parseFloat(opM[2]); }
            inputs.push({
              x: opX, y: opY,
              pathD: op.getAttribute("d") || "",
              fill: op.getAttribute("fill") || "#FFFFFF"
            });
          }
        }
        list.push({
          id: block.id, type: block.type,
          x: pos.x, y: pos.y,
          width: block.width || 0, height: block.height || 0,
          pathD, color, stroke,
          opacity: (block as any).getOpacity(),
          depth: getDepth(block),
          fields, inputs
        });
        if (block.nextConnection) {
          const next = block.nextConnection.targetBlock();
          if (next) stack.push(next);
        }
        for (const input of block.inputList) {
          if (input.connection) {
            const child = input.connection.targetBlock();
            if (child) stack.push(child);
          }
        }
      }
      list.sort((a, b) => a.depth - b.depth);
      return list;
    };

    // 烘焙 chunk
    const bakeChunks = (data: any[], rootBlocks: any[], onlyRootId?: string): Promise<void> => {
      return new Promise((resolve) => {
        // 先收集所有需要绘制的任务（只计算，不绘制）
        const drawTasks: Array<{
          chunkData: any[];
          dpr: number;
          minX: number;
          minY: number;
          padding: number;
          canvasWidth: number;
          canvasHeight: number;
          rootId: string;
          depth: number;
        }> = [];

        const dataMap = new Map<string, any>();
        for (const item of data) dataMap.set(item.id, item);
        const topBlocks = rootBlocks;
        const baseDpr = window.devicePixelRatio || 1;
        const padding = 24;
        const MAX_PHYSICAL_SIZE = getMaxTextureSize();
        const globalVisited = new Set<string>();

        // 原封不动地计算每个 chunk 的参数，但不再创建 canvas 和绘制
        for (const topBlock of topBlocks) {
          if (onlyRootId && topBlock.id !== onlyRootId) continue;
          const rootId = topBlock.id;
          const blockIds: string[] = [];
          const stack = [topBlock];
          while (stack.length > 0) {
            const block = stack.pop();
            if (!block || globalVisited.has(block.id)) continue;
            globalVisited.add(block.id);
            blockIds.push(block.id);
            if (block.nextConnection) {
              const next = block.nextConnection.targetBlock();
              if (next) stack.push(next);
            }
            for (const input of block.inputList) {
              if (input.connection) {
                const child = input.connection.targetBlock();
                if (child) stack.push(child);
              }
            }
          }
          if (blockIds.length === 0) continue;
          const groupData = blockIds.map(id => dataMap.get(id)).filter(Boolean);
          if (groupData.length === 0) continue;
          groupData.sort((a, b) => a.y - b.y);

          let chunkStart = 0;
          while (chunkStart < groupData.length) {
            let minY = groupData[chunkStart].y;
            let maxY = minY + (groupData[chunkStart].height || 0);
            let minX = Infinity, maxX = -Infinity;
            let chunkEnd = chunkStart;
            minX = Math.min(minX, groupData[chunkStart].x);
            maxX = Math.max(maxX, groupData[chunkStart].x + (groupData[chunkStart].width || 0));

            let chunkDpr = baseDpr;
            const getMaxLogicHeight = (dpr: number) => Math.floor(MAX_PHYSICAL_SIZE / dpr) - padding * 2;

            for (let i = chunkStart + 1; i < groupData.length; i++) {
              const item = groupData[i];
              const newMinY = Math.min(minY, item.y);
              const newMaxY = Math.max(maxY, item.y + (item.height || 0));
              const newMinX = Math.min(minX, item.x);
              const newMaxX = Math.max(maxX, item.x + (item.width || 0));
              if (newMaxY - newMinY + padding * 2 <= getMaxLogicHeight(chunkDpr)) {
                chunkEnd = i;
                minY = newMinY; maxY = newMaxY;
                minX = newMinX; maxX = newMaxX;
              } else break;
            }

            if (chunkStart === chunkEnd) {
              const singleHeight = (groupData[chunkStart].height || 0) + padding * 2;
              if (singleHeight > getMaxLogicHeight(chunkDpr)) {
                let reducedDpr = chunkDpr * 0.9;
                while (reducedDpr >= 0.1 && singleHeight > Math.floor(MAX_PHYSICAL_SIZE / reducedDpr) - padding * 2) reducedDpr *= 0.9;
                if (reducedDpr >= 0.1) { chunkDpr = reducedDpr; }
                else { chunkStart++; continue; }
              }
            }

            const chunkData = groupData.slice(chunkStart, chunkEnd + 1);
            const canvasWidth = Math.ceil(maxX - minX + padding * 2);
            const canvasHeight = Math.ceil(maxY - minY + padding * 2);
            let physWidth = Math.ceil(canvasWidth * chunkDpr);
            let physHeight = Math.ceil(canvasHeight * chunkDpr);

            if (physWidth > MAX_PHYSICAL_SIZE || physHeight > MAX_PHYSICAL_SIZE) {
              let reducedDpr = chunkDpr * 0.9;
              while (reducedDpr >= 0.2 && (Math.ceil(canvasWidth * reducedDpr) > MAX_PHYSICAL_SIZE || Math.ceil(canvasHeight * reducedDpr) > MAX_PHYSICAL_SIZE)) reducedDpr *= 0.9;
              if (reducedDpr >= 0.2) { chunkDpr = reducedDpr; }
              else { chunkStart = chunkEnd + 1; continue; }
            }

            // 只收集任务，不绘制
            drawTasks.push({
              chunkData,
              dpr: chunkDpr,
              minX,
              minY,
              padding,
              canvasWidth,
              canvasHeight,
              rootId,
              depth: getDepth(topBlock),
            });

            chunkStart = chunkEnd + 1;
          }
        }

        // 分帧绘制
        let index = 0;
          const drawNext = () => {
            if (index >= drawTasks.length) {
              //console.log(`[Pixi] Baked ${chunkCache.length} chunks (async)`);
              resolve();
              return;
            }
            const frameDeadline = performance.now() + 5; // 本帧最多绘制5ms
            while (index < drawTasks.length && performance.now() < frameDeadline) {
              const task = drawTasks[index];
              const canvas = document.createElement('canvas');
              const physW = Math.ceil(task.canvasWidth * task.dpr);
              const physH = Math.ceil(task.canvasHeight * task.dpr);
              try { canvas.width = physW; canvas.height = physH; } catch (e) { index++; drawNext(); return; }
              const ctx = canvas.getContext('2d');
              if (!ctx) { index++; drawNext(); return; }
              ctx.scale(task.dpr, task.dpr);
              ctx.translate(-task.minX + task.padding, -task.minY + task.padding);

              // 绘制形状
              try {
                for (const item of task.chunkData) {
                  if (!item.pathD) continue;
                  ctx.save(); ctx.translate(item.x, item.y);
                  ctx.fillStyle = item.color; ctx.globalAlpha = 1;
                  ctx.fill(new Path2D(item.pathD));
                  if (item.stroke && item.stroke !== item.color) {
                    ctx.strokeStyle = item.stroke; ctx.lineWidth = 1;
                    ctx.stroke(new Path2D(item.pathD));
                  }
                  ctx.restore();
                }
              } catch (e) { console.error('[Pixi] Drawing shapes failed:', e); }
              // 绘制输入
              try {
                for (const item of task.chunkData) {
                  for (const inp of item.inputs) {
                    if (!inp.pathD) continue;
                    ctx.save(); ctx.translate(item.x + inp.x, item.y + inp.y);
                    ctx.fillStyle = inp.fill; ctx.globalAlpha = 1;
                    ctx.fill(new Path2D(inp.pathD));
                    ctx.restore();
                  }
                }
              } catch (e) { console.error('[Pixi] Drawing inputs failed:', e); }
              // 绘制文字
              try {
                for (const item of task.chunkData) {
                  for (const f of item.fields) {
                    ctx.save(); ctx.translate(item.x + f.x, item.y + f.y);
                    ctx.font = `${f.fontSize}px ${f.fontFamily || 'sans-serif'}`;
                    ctx.fillStyle = f.fill;
                    ctx.textAlign = f.anchorX === 0.5 ? 'center' : f.anchorX === 1 ? 'right' : 'left';
                    ctx.textBaseline = f.anchorY === 0.5 ? 'middle' : f.anchorY === 0 ? 'top' : 'bottom';
                    ctx.fillText(f.text, 0, 0);
                    ctx.restore();
                  }
                }
              } catch (e) { console.error('[Pixi] Drawing text failed:', e); }

              chunkCache.push({
                canvas,
                x: task.minX - task.padding,
                y: task.minY - task.padding,
                width: task.canvasWidth,
                height: task.canvasHeight,
                rootId: task.rootId,
                sprite: undefined,
                depth: task.depth,
              });
              index++;
            }
            if (index < drawTasks.length) {
              requestAnimationFrame(drawNext);
            } else {
              resolve();
            }
          };
          drawNext();
      });
    };

    // 视口更新
    const updateViewport = () => {
    if (!worldContainer || chunkCache.length === 0) return;
    const scale = worldContainer.scale.x;
    const x = -worldContainer.position.x / scale;
    const y = -worldContainer.position.y / scale;
    const w = app.screen.width / scale;
    const h = app.screen.height / scale;

    const visible = new Set<any>();
    for (const chunk of chunkCache) {
      if (chunk.x + chunk.width > x && chunk.x < x + w && chunk.y + chunk.height > y && chunk.y < y + h) visible.add(chunk);
    }
    for (const chunk of visible) {
      if (!chunk.sprite) {
        const tex = PIXI.Texture.from(chunk.canvas);
        tex.source.style.scaleMode = 'nearest';
        const sprite = new PIXI.Sprite(tex);
        sprite.width = chunk.width;
        sprite.height = chunk.height;
        const hitWidth = chunk.width * 0.85;
        sprite.hitArea = new PIXI.Rectangle(0, 0, hitWidth, chunk.height);
        sprite.x = chunk.x;
        sprite.y = chunk.y;
        worldContainer.addChild(sprite);
        chunk.sprite = sprite;
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        (sprite as any)._hoverAlpha = { current: 0, target: 0.5 };
        sprite.alpha = 0;
        sprite.on('pointerover', () => { (sprite as any)._hoverAlpha.target = 0.8; });
        sprite.on('pointerout', () => { (sprite as any)._hoverAlpha.target = 0.5; });
      }
    }
  };

    // 刷新整个 overlay
    const refreshOverlay = async () => {
      if (rendering || !initialized) return;
      rendering = true;
      syncView();
      const ct = vm.editingTarget;
      if (!ct) { rendering = false; return; }
      const tId = ct.id;
      const activeId = getActiveGroupId(tId);
      const topBlocks = workspace.getTopBlocks(false);
      const filteredTop = activeId === ALL_GROUPS_ID
        ? topBlocks
        : topBlocks.filter((b: any) => getBlockGroup(b) === activeId);
      const data: any[] = [];
      for (const top of filteredTop) {
        data.push(...extractTreeBlocks(top));
      }
      // 隐藏 DOM
      const allBlocks = workspace.getAllBlocks(false);
      for (const block of allBlocks) {
        if (block.svgGroup_) block.svgGroup_.style.display = 'none';
      }
      // 销毁旧纹理
      for (const chunk of chunkCache) {
        if (chunk.sprite) {
          worldContainer.removeChild(chunk.sprite);
          chunk.sprite.destroy({ texture: true });
        }
      }
      chunkCache = [];

      // 异步分帧烘焙
      await bakeChunks(data, filteredTop);

      // 全部绘制完成后再一次性显示
      updateViewport();
      rendering = false;
    };

    // 局部刷新一棵树
    const refreshRootBlock = (rootBlock: any) => {
      const rootId = rootBlock.id;
      const rootData = extractTreeBlocks(rootBlock);
      const blockIds = rootData.map(item => item.id);
      for (const chunk of chunkCache) {
        if (chunk.rootId === rootId && chunk.sprite) {
          worldContainer.removeChild(chunk.sprite);
          chunk.sprite.destroy({ texture: true });
        }
      }
      chunkCache = chunkCache.filter(c => c.rootId !== rootId);
      for (const id of blockIds) {
        const block = workspace.getBlockById(id);
        if (block?.svgGroup_) {
          block.svgGroup_.style.display = 'none';
          (block.svgGroup_.style as any).contentVisibility = '';
        }
      }
      bakeChunks(rootData, [rootBlock], rootId);
      updateViewport();
    };

    // 清理无头 chunk
    const cleanOrphanChunks = () => {
      for (const chunk of chunkCache) {
        const block = workspace.getBlockById(chunk.rootId);
        if (!block || (block as any).getParent()) {
          if (chunk.sprite) {
            if (chunk.canvas instanceof ImageBitmap) {
              chunk.canvas.close();
            }
            worldContainer.removeChild(chunk.sprite);
            chunk.sprite.destroy({ texture: true });
          }
        }
      }
      chunkCache = chunkCache.filter(c => {
        const block = workspace.getBlockById(c.rootId);
        return block && !(block as any).getParent();
      });
    };

    // 清除 Pixi 并恢复 DOM
    const clearPixiAndRestoreDOM = (block: any) => {
      if (!block || block.workspace !== workspace) return;
      const rootBlock = block.getRootBlock();
      if (!rootBlock) return;
      const blockIds: string[] = [];
      const stack = [rootBlock];
      const visited = new Set<string>();
      while (stack.length > 0) {
        const b = stack.pop();
        if (!b || visited.has(b.id)) continue;
        visited.add(b.id);
        blockIds.push(b.id);
        if (b.nextConnection) {
          const next = b.nextConnection.targetBlock();
          if (next) stack.push(next);
        }
        for (const input of b.inputList) {
          if (input.connection) {
            const child = input.connection.targetBlock();
            if (child) stack.push(child);
          }
        }
      }
      for (const chunk of chunkCache.filter(c => c.rootId === rootBlock.id)) {
        if (chunk.sprite) {
          if (chunk.sprite.parent) chunk.sprite.parent.removeChild(chunk.sprite);
          chunk.sprite.destroy({ texture: true });
        }
      }
      chunkCache = chunkCache.filter(c => c.rootId !== rootBlock.id);
      for (const id of blockIds) {
        const b = workspace.getBlockById(id);
        if (b?.svgGroup_) {
          (b.svgGroup_.style as any).contentVisibility = '';
          b.svgGroup_.style.display = '';
        }
      }
    };

    // 获取工作区坐标
    const getWorkspacePosFromEvent = (e: MouseEvent) => {
      if (!worldContainer) return null;
      const canvas = app.canvas;
      const rect = canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const x = (relX - worldContainer.position.x) / worldContainer.scale.x;
      const y = (relY - worldContainer.position.y) / worldContainer.scale.y;
      return { x, y };
    };

    // 双击恢复积木
    const restoreRootBlock = (chunk: any) => {
      const rootId = chunk.rootId;
      const rootBlock = workspace.getBlockById(rootId);
      if (!rootBlock) return;
      const blockIds: string[] = [];
      const stack = [rootBlock];
      const visited = new Set<string>();
      while (stack.length > 0) {
        const block = stack.pop();
        if (!block || visited.has(block.id)) continue;
        visited.add(block.id);
        blockIds.push(block.id);
        if (block.nextConnection) {
          const next = block.nextConnection.targetBlock();
          if (next) stack.push(next);
        }
        for (const input of block.inputList) {
          if (input.connection) {
            const child = input.connection.targetBlock();
            if (child) stack.push(child);
          }
        }
      }
      for (const id of blockIds) {
        const block = workspace.getBlockById(id);
        if (block?.svgGroup_) {
          (block.svgGroup_.style as any).contentVisibility = '';
          block.svgGroup_.style.display = '';
          if ((block as any).intersects_ === false) {
            (block as any).setIntersects(true);
          }
        }
      }
      for (const c of chunkCache.filter(c => c.rootId === rootId)) {
        if (c.sprite) {
          worldContainer.removeChild(c.sprite);
          c.sprite.destroy({ texture: true });
        }
      }
      chunkCache = chunkCache.filter(c => c.rootId !== rootId);
      updateViewport();
    };

    // 双击监听
    const handleDoubleClick = (e: MouseEvent) => {
      if (!worldContainer || chunkCache.length === 0) return;
      const pos = getWorkspacePosFromEvent(e);
      if (!pos) return;
      for (const chunk of chunkCache) {
        if (pos.x >= chunk.x && pos.x <= chunk.x + chunk.width && pos.y >= chunk.y && pos.y <= chunk.y + chunk.height) {
          e.preventDefault();
          e.stopImmediatePropagation();
          restoreRootBlock(chunk);
          return;
        }
      }
    };

    // 创建 wrapper
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "0";
    workspaceDiv.style.position = "relative";
    workspaceDiv.appendChild(wrapper);

    // 劫持各种方法（在启用 Pixi 时）
    if (WorkspaceDragger && originalDrag) {
      WorkspaceDragger.drag = function (d: any) {
        originalDrag.call(this, d);
        syncView();
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
      syncView();
    };

    if (ScrollbarPair && originalScrollSet) {
      ScrollbarPair.set = function (x: number, y: number) {
        originalScrollSet.call(this, x, y);
        syncView();
      };
    }

    if (BlockDragger && originalEndDrag) {
      BlockDragger.endBlockDrag = function (e: Event, delta: any, checkFn?: Function) {
        originalEndDrag.call(this, e, delta, checkFn);
        rendering = false;
        const root = this.draggingBlock_.getRootBlock();
        if (this.draggingBlock_?.workspace === workspace) {
          requestAnimationFrame(() => {
            cleanOrphanChunks();
          });
        }
      };
    }

    if (BlockSvgProto && originalMoveBy) {
      BlockSvgProto.moveBy = function (dx: number, dy: number) {
        const rootId = this.getRootBlock().id;
        const hasPixi = chunkCache.some(c => c.rootId === rootId && c.sprite);
        if (hasPixi) {
          requestAnimationFrame(() => refreshRootBlock(this.getRootBlock()));
        }
        originalMoveBy.call(this, dx, dy);
      };
    }

    if (originalUpdateIntersectionObserver) {
      BlockSvgProto.updateIntersectionObserver = function () {
        const block = this as any;
        if (block.workspace?.intersectionObserver) {
          block.workspace.intersectionObserver.unobserve(block);
          if (block.intersects_ === false) {
            block.intersects_ = true;
          }
        }
      };
    }

    if (BlocklyXml && originalDomToBlock) {
      BlocklyXml.domToBlock = function (xmlBlock: Element, targetWorkspace: any) {
        const result = originalDomToBlock.call(this, xmlBlock, targetWorkspace);
        // 不自动刷新，留给后续操作
        return result;
      };
    }

    if (InsertionMarkerManager) {
      originalConnectMarker = InsertionMarkerManager.prototype.connectMarker_;
      originalDisconnectMarker = InsertionMarkerManager.prototype.disconnectMarker_;
      InsertionMarkerManager.prototype.connectMarker_ = function () {
        originalConnectMarker.call(this);
        const closestConn = (this as any).closestConnection_;
        if (closestConn) {
          const targetBlock = closestConn.sourceBlock_;
          if (targetBlock && targetBlock.workspace === workspace) {
            clearPixiAndRestoreDOM(targetBlock.getRootBlock());
          }
        }
      };
      InsertionMarkerManager.prototype.disconnectMarker_ = function () {
        const closestConn = (this as any).closestConnection_;
        let rootId: string | null = null;
        if (closestConn) {
          const targetBlock = closestConn.sourceBlock_;
          if (targetBlock && targetBlock.workspace === workspace) {
            clearPixiAndRestoreDOM(targetBlock.getRootBlock());
          }
        }
        originalDisconnectMarker.call(this);
      };
    }

    if (Connection) {
      Connection.connect_ = function (childConnection: any) {
        const childBlock = childConnection.sourceBlock_;
        const oldRoot = childBlock ? childBlock.getRootBlock() : null;
        originalConnect_.call(this, childConnection);
        clearPixiAndRestoreDOM(this.sourceBlock_);
        if (oldRoot && oldRoot !== this.sourceBlock_.getRootBlock()) {
          cleanOrphanChunks();
        }
      };
      Connection.disconnectInternal_ = function (parentBlock: any, childBlock: any) {
        originalDisconnectInternal_.call(this, parentBlock, childBlock);
        clearPixiAndRestoreDOM(parentBlock);
        clearPixiAndRestoreDOM(childBlock);
      };
    }

    vm.setEditingTarget = function (targetId: string) {
      if (worldContainer) {
        while (worldContainer.children.length > 0) {
          worldContainer.removeChildAt(0).destroy({ texture: true });
        }
      }
      chunkCache = [];
      if (app.renderer) {
        if ((app.renderer as any).gc) {
          (app.renderer as any).gc.run();
        } else if ((app.renderer as any).textureGC) {
          (app.renderer as any).textureGC.run();
        }
      }
      rendering = false;
      const result = originalSetEditingTarget(targetId);
      requestAnimationFrame(() => refreshOverlay());
      return result;
    };
    

    workspaceDiv.addEventListener('dblclick', handleDoubleClick, true);

    // 启动 Pixi 并首次刷新
    initPixi().then(() => {
      syncView();
      refreshOverlay();
      app.ticker.add(() => {
        for (const child of worldContainer.children) {
          const sprite = child as PIXI.Sprite;
          const anim = (sprite as any)._hoverAlpha;
          if (!anim) continue;
          anim.current += (anim.target - anim.current) * 0.15;
          sprite.alpha = anim.current;
          //挂载refreshOverlay
          (window as any).__PIXI_REFRESH_OVERLAY__ = refreshOverlay;
        }
      });
    });

    // 返回清理函数（当 pixiEnabled 变为 false 或组件卸载时调用）
    return () => {
      // 恢复所有劫持
      if (WorkspaceDragger) WorkspaceDragger.drag = originalDrag;
      workspace.setScale = originalSetScale;
      if (ScrollbarPair) ScrollbarPair.set = originalScrollSet;
      if (BlockDragger) BlockDragger.endBlockDrag = originalEndDrag;
      if (BlockSvgProto) BlockSvgProto.moveBy = originalMoveBy;
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

      // 移除 Pixi 右键菜单
      if (menuItemId != null && ContextMenu?.deleteDynamicMenuItem) {
        ContextMenu.deleteDynamicMenuItem(menuItemId);
      }
      //移除挂载的refreshOverlay
      delete (window as any).__PIXI_REFRESH_OVERLAY__;
      // 移除事件监听
      workspaceDiv.removeEventListener('dblclick', handleDoubleClick, true);

      // 销毁所有 sprite 和纹理
      for (const chunk of chunkCache) {
        if (chunk.sprite) chunk.sprite.destroy({ texture: true });
      }
      chunkCache = [];
      
      // 恢复所有隐藏的积木 DOM
      const allBlocks = workspace.getAllBlocks(false);
      for (const block of allBlocks) {
        if (block.svgGroup_) {
          (block.svgGroup_.style as any).contentVisibility = '';
          block.svgGroup_.style.display = '';
        }
      }
      // 销毁 Pixi 应用
      app.destroy(true, { children: true, texture: true });
      wrapper.remove();
    };
  }, [pixiEnabled, blockly, workspace, vm]); // 依赖 pixiEnabled，开关变化时重新执行

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
            title="积木分组"
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
                <span className={styles.itemText}>📁 全部显示</span>
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
                    placeholder="新分组名称"
                    value={newGroupName}
                    onChange={(e: any) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className={styles.addGroupRow}>
                  <button className={styles.addButton} onClick={handleAddGroup}>
                    <AddIcon />新建
                  </button>
                  <button
                    className={styles.addButton}
                    onClick={async () => {
                      if (!targetId) return;
                      try {
                        disposeOffscreenCache(targetId);
                        toast.success('已重置缓存');
                      } catch (e) {
                        toast.error('刷新失败');
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                      <path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    重置缓存
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