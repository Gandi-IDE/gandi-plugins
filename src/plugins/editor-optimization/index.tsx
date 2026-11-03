declare global {
  interface Window {
    __ENABLE_FULLSCREEN_OPTIMIZATION__?: boolean;
    __IN_FULLSCREEN_MODE__?: boolean;
    __ENABLE_PIXI_OPTIMIZATION__?: boolean;
    __IS_COLLABORATION__?: boolean;
  }
}

import React, { useEffect, useRef, useCallback, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./styles.less";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import Tooltip from "components/Tooltip";
import toast from "react-hot-toast";
import { Box, Input, IconButton } from "@gandi-ide/gandi-ui";
import * as PIXI from "pixi.js";
import JSZip from "jszip";
import {
  getGroups, getActiveGroupId, setActiveGroupId, addGroup, deleteGroup, renameGroup,
  setBlockGroup, getBlockGroup, restoreBlockGroupFromXml, loadFromLocalStorage,
  setGlobalVM, ALL_GROUPS_ID, UNGROUPED_ID, lockCommentWrite
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

const AddIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>);
const DeleteIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);
const CheckIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>);
const GroupIcon = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>);
const DEFAULT_CONTAINER_INFO = { width: 229, height: 360, translateX: 72, translateY: 60 };

function getRootBlock(block: any): any {
  let r = block;
  while (r?.getParent?.()) r = r.getParent();
  return r;
}

function cleanupFramesAfterLoad(ws: any) {
  if (!ws) return;
  const frames = ws.getTopFrames?.(false) || [];
  frames.forEach((f: any) => {
    if (f.frameGroup_) f.frameGroup_.remove();
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

// ---------- 内部组件：包含所有原有逻辑 ----------
const EditorOptimizationInner: React.FC<PluginContext> = ({ vm, blockly, workspace, registerSettings, teamworkManager, msg }) => {
  const [visible, setVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string>(ALL_GROUPS_ID);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [containerInfo, setContainerInfo] = useState<ExpansionRect>(DEFAULT_CONTAINER_INFO);
  const containerInfoRef = useRef(containerInfo);
  const pixiRendererRef = useRef<PixiBlockRenderer | null>(null);
  const lastTargetIdRef = useRef<string | null>(null);
  const [pixiEnabled, setPixiEnabled] = useState(false);

  useEffect(() => { setGlobalVM(vm); }, [vm]);
  useEffect(() => { loadFromLocalStorage(); }, []);

  const refreshGroups = useCallback(() => {
    if (!targetId) return;
    setGroups(getGroups(targetId));
    setActiveGroupIdState(getActiveGroupId(targetId));
  }, [targetId]);

  useEffect(() => {
    const update = () => {
      const id = (vm as any).editingTarget?.id || (vm as any).runtime?._editingTarget?.id || null;
      if (id && id !== targetId) setTargetId(id);
    };
    update();
    const iv = setInterval(update, 200);
    return () => clearInterval(iv);
  }, [vm, targetId]);

  useEffect(() => { refreshGroups(); }, [targetId, refreshGroups]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContainerInfo({ ...containerInfoRef.current, translateX: rect.x + 28, translateY: rect.y - 6 });
    setVisible(true);
    refreshGroups();
  };

  const handleSelectGroup = (groupId: string) => {
    if (!targetId) return;
    if (pixiEnabled) {
      requestAnimationFrame(() => {
        (window as any).__PIXI_REFRESH_OVERLAY__?.();
      });
    }
    if (getOffscreenWorkspace(targetId)) {
      try {
        switchGroup(targetId, groupId, workspace, blockly, getBlockGroup, ALL_GROUPS_ID);
        setActiveGroupIdState(groupId);
        setActiveGroupId(targetId, groupId);
        (vm as any).emitWorkspaceUpdate?.();
        refreshGroups();
        if (pixiEnabled && pixiRendererRef.current) {
          const allTopBlocks = workspace.getTopBlocks(false);
          const renderer = pixiRendererRef.current;
          const toAdd = allTopBlocks.filter(
            (b: any) => !renderer.hasPixiForRoot(b.id) && !renderer['domOnlyRoots']?.has(b.id)
          );
          if (toAdd.length > 0) renderer.addBlocks(toAdd);
        }
      } catch (e) {
        console.error('离屏分组切换失败', e);
        toast.error(msg('plugins.editorOptimization.groupSwitchFail'));
      }
      return;
    } else {
      setActiveGroupId(targetId, groupId);
      setActiveGroupIdState(groupId);
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
  const downloadCleanedProject = async () => {
    if (!vm) {
      toast.error("未获取到虚拟机实例");
      return;
    }

    try {
      // 1. 调用 VM 自带的 saveProjectSb3 生成标准 SB3 Blob
      const originalSb3Blob = await (vm as any).saveProjectSb3?.();
      if (!originalSb3Blob) {
        throw new Error("saveProjectSb3 不可用");
      }

      // 2. 用 JSZip 读取该压缩包
      const zip = await JSZip.loadAsync(originalSb3Blob);
      const projectFile = zip.file("project.json");
      if (!projectFile) {
        throw new Error("project.json 不存在");
      }

      // 3. 解析并清理 project.json
      const projectJson = JSON.parse(await projectFile.async("text"));

      // 删除积木的 comment 引用（分组注释）
      projectJson.targets?.forEach((target: any) => {
        if (target.blocks) {
          Object.values(target.blocks).forEach((block: any) => {
            if (block && block.comment) {
              delete block.comment;
            }
          });
        }
        // 删除 comments 中带分组标记的条目
        if (target.comments && typeof target.comments === "object") {
          Object.keys(target.comments).forEach((commentId) => {
            const comment = target.comments[commentId];
            if (
              comment &&
              typeof comment.text === "string" &&
              comment.text.includes("|EdiOpt|")
            ) {
              delete target.comments[commentId];
            }
          });
        }
      });

      // 4. 重新写入 project.json
      zip.file("project.json", JSON.stringify(projectJson));

      // 5. 生成新的 Blob 并下载
      const cleanedBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(cleanedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(vm.runtime as any).getTargetForStage()?.getName?.() || "project"}_cleaned.sb3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("已下载过滤分组注释的作品");
    } catch (error) {
      console.error("下载失败", error);
      toast.error("下载失败，请稍后重试");
    }
  };
  // 设置注册（无 Fast Clear）
  useEffect(() => {
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
              key: 'enableFullscreenOptimize',
              type: 'switch',
              label: msg('plugins.editorOptimization.enableFullscreenLabel'),
              description: msg('plugins.editorOptimization.enableFullscreenDesc'),
              value: false,
              onChange: (v: boolean) => {
                window.__ENABLE_FULLSCREEN_OPTIMIZATION__ = v;
              }
            },
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

  if (teamworkManager && !(window as any).__IS_COLLABORATION__) {
    (window as any).__IS_COLLABORATION__ = true;
    console.log('[editor-optimization] 检测到协作环境，已禁用离屏缓存。');
  }

  // 核心劫持：clearWorkspaceAndLoadFromXml
  useEffect(() => {
    if (!blockly || !workspace || !vm) return;

    const origClear = blockly.Xml?.clearWorkspaceAndLoadFromXml;
    if (!origClear) return;

    blockly.Xml.clearWorkspaceAndLoadFromXml = function(xml: any, ...args: any[]) {
      const ct = (vm as any).editingTarget || (vm as any).runtime?._editingTarget;
      const tw = workspace || this;
      if (!ct) return origClear.call(this, xml, ...args);

      const newTargetId = ct.id;
      if (lastTargetIdRef.current && lastTargetIdRef.current !== newTargetId) {
        try {
          saveTargetToOffscreen(lastTargetIdRef.current, workspace, blockly);
        } catch (e) {
          console.warn('[离屏缓存] 保存旧角色失败', e);
        }
      }
      lastTargetIdRef.current = newTargetId;

      const activeId = getActiveGroupId(newTargetId);
      if (lastTargetIdRef.current === newTargetId && tw.getTopBlocks(false).length > 0) {
        if ((window as any).__ENABLE_PIXI_OPTIMIZATION__) {
          requestAnimationFrame(() => {
            (window as any).__PIXI_REFRESH_OVERLAY__?.();
          });
        }
        return tw;
      }

      if (getOffscreenWorkspace(newTargetId)) {
        try {
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
          if ((tw as any).intersectionObserver) {
            (tw as any).intersectionObserver.observing = [];
          }
          const origResize = tw.resize;
          tw.resize = function() {};
          setTimeout(() => { tw.resize = origResize; }, 0);
          restoreTargetFromOffscreen(
            newTargetId, tw, blockly, activeId,
            getBlockGroup, ALL_GROUPS_ID
          );
          cleanupFramesAfterLoad(tw);
          setTimeout(() => refreshGroups(), 20);
          return tw;
        } catch (e) {
          console.error('[离屏缓存] 恢复失败，回退到 XML 加载', e);
        }
      }

      const originalActiveId = getActiveGroupId(newTargetId);
      setActiveGroupId(newTargetId, ALL_GROUPS_ID);

      let xmlString = typeof xml === 'string' ? xml : new XMLSerializer().serializeToString(xml);
      const doc = new DOMParser().parseFromString(xmlString, "text/xml");
      const root = doc.documentElement;
      if (!root) {
        setActiveGroupId(newTargetId, originalActiveId);
        return origClear.call(this, xml, ...args);
      }

      Array.from(root.children)
        .filter(c => c.tagName.toLowerCase() === 'block')
        .forEach(n => restoreBlockGroupFromXml(n as Element, newTargetId));

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
      cleanupFramesAfterLoad(tw);

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
      cleanupFramesAfterLoad(tw);

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
                        const hideBlockStack = (b: any) => {
                          if (!b) return;
                          if (b.getSvgRoot) {
                            const rootSvg = b.getSvgRoot();
                            if (rootSvg) rootSvg.style.display = 'none';
                          }
                          const children = b.getChildren(false);
                          children.forEach((child: any) => hideBlockStack(child));
                        };
                        hideBlockStack(root);
                      }
                    } else {
                      const hideBlockStack = (b: any) => {
                        if (!b) return;
                        if (b.getSvgRoot) {
                          const rootSvg = b.getSvgRoot();
                          if (rootSvg) rootSvg.style.display = 'none';
                        }
                        const children = b.getChildren(false);
                        children.forEach((child: any) => hideBlockStack(child));
                      };
                      hideBlockStack(root);
                    }
                  }
                  toast.success(msg('plugins.editorOptimization.groupMoveSuccess')+`「${g.name}」`);
                } catch (e) {}
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

  // 阻止注释
  useEffect(() => {
    if (!blockly) return;
    const BlockSvg = blockly.BlockSvg.prototype;
    const origSetCommentText = BlockSvg.setCommentText;

    BlockSvg.setCommentText = function (text: string) {
      origSetCommentText.call(this, text);
      if (this.comment && !this.comment.__hiddenByPlugin) {
        this.comment.__hiddenByPlugin = true;
        if (this.comment.iconGroup_) {
          this.comment.iconGroup_.style.visibility = 'hidden';
          this.comment.iconGroup_.style.pointerEvents = 'none';
        }
        if (this.comment.isVisible()) {
          this.comment.setVisible(false);
        }
        const origSetVisible = this.comment.setVisible;
        this.comment.setVisible = function (visible: boolean) {
          if (visible) return;
          return origSetVisible.call(this, false);
        };
      }
    };

    return () => {
      BlockSvg.setCommentText = origSetCommentText;
    };
  }, [blockly]);

  // 拖拽锁定注释 + Pixi 清理
  useEffect(() => {
    if (!blockly) return;
    const Gesture = (blockly as any).Gesture?.prototype;
    const BlockDragger = (blockly as any).BlockDragger?.prototype;
    if (!Gesture || !BlockDragger) return;

    const origStartDraggingBlock = Gesture.startDraggingBlock_;
    const origEndBlockDrag = BlockDragger.endBlockDrag;

    Gesture.startDraggingBlock_ = function () {
      lockCommentWrite(true);
      const block = this.block_ || this.block;
      if (block && pixiRendererRef.current) {
        const root = block.getRootBlock();
        if (root) pixiRendererRef.current.clearPixiForRoot(root);
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

  // 全屏优化
  useEffect(() => {
    if (!vm || !workspace) return;
    const runtime = (vm as any).runtime;
    if (!runtime) return;
    const renderer = runtime.renderer;
    if (!renderer) return;
    const RenderWebGLProto = Object.getPrototypeOf(renderer);
    if (!RenderWebGLProto || !RenderWebGLProto.resize) return;

    const origResize = RenderWebGLProto.resize;
    const injectionDiv = workspace.getInjectionDiv();

    RenderWebGLProto.resize = function(pixelsWide: number, pixelsTall: number) {
      const { canvas } = this._gl;
      if (window.__ENABLE_FULLSCREEN_OPTIMIZATION__){
        const isEnteringFullscreen = pixelsTall > canvas.height;
        const isExitingFullscreen = pixelsTall <= canvas.height;
        
        if (isEnteringFullscreen && !window.__IN_FULLSCREEN_MODE__) {
          window.__IN_FULLSCREEN_MODE__ = true;
          if (injectionDiv) (injectionDiv as any).style.display = 'none';
          if ((Blockly as any).Events) (Blockly as any).Events.disable();
        } else if (isExitingFullscreen && window.__IN_FULLSCREEN_MODE__) {
          window.__IN_FULLSCREEN_MODE__ = false;
          if (injectionDiv) (injectionDiv as any).style.display = '';
          if ((Blockly as any).Events) (Blockly as any).Events.enable();
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

  // Frame 完全禁用
  useEffect(() => {
    if (!blockly || !workspace) return;

    const workspaceProto = Object.getPrototypeOf(workspace);

    const origDomToFrame = blockly.Xml?.domToFrame;
    if (origDomToFrame) {
      blockly.Xml.domToFrame = function () { return null; };
    }

    const origCreateFrame = workspaceProto.createFrame;
    if (origCreateFrame) {
      workspaceProto.createFrame = function () { return null; };
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

  // Pixi 渲染器
  useEffect(() => {
    if (!pixiEnabled || !blockly || !workspace || !vm) {
      if (pixiRendererRef.current) {
        pixiRendererRef.current.destroy();
        pixiRendererRef.current = null;
      }
      return;
    }

    const workspaceDiv = workspace.getParentSvg()?.parentElement as HTMLElement;
    if (!workspaceDiv) return;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";
    workspaceDiv.style.position = "relative";
    workspaceDiv.appendChild(wrapper);

    const debugPanel = document.createElement('div');
    const isCollab = !!(window as any).__IS_COLLABORATION__;
    debugPanel.style.cssText = isCollab
      ? "position: absolute; bottom: 8px; left: 496px; color: #fff; background: rgba(0, 0, 0, 0.6); font-family: monospace; font-size: 12px; padding: 4px 8px; border-radius: 4px; z-index: 9999; pointer-events: auto; line-height: 1.4; cursor: move; user-select: none;"
      : "position: absolute; bottom: 8px; left: 332px; color: #fff; background: rgba(0, 0, 0, 0.6); font-family: monospace; font-size: 12px; padding: 4px 8px; border-radius: 4px; z-index: 9999; pointer-events: auto; line-height: 1.4; cursor: move; user-select: none;";
    wrapper.appendChild(debugPanel);

    let dragging = false, offsetX = 0, offsetY = 0, useTop = false;
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      const rect = debugPanel.getBoundingClientRect();
      offsetX = e.clientX - rect.left + 72;
      offsetY = e.clientY - rect.top + 60;
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

    const renderer = new PixiBlockRenderer(wrapper, workspace, blockly, vm);
    renderer.onRestoreDOM = (rootId: string) => {
      const rootBlock = workspace.getBlockById(rootId);
      if (rootBlock) renderer.clearPixiForRoot(rootBlock);
    };

    let ignoreNextDoubleClick = false;
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

    const BlocklyAny = blockly as any;
    const WorkspaceDragger = BlocklyAny.WorkspaceDragger?.prototype;
    const ScrollbarPair = BlocklyAny.ScrollbarPair?.prototype;
    const BlockDragger = BlocklyAny.BlockDragger?.prototype;
    const BlockSvgProto = blockly.BlockSvg.prototype;
    const InsertionMarkerManager = BlocklyAny.InsertionMarkerManager;
    const Connection = BlocklyAny.Connection?.prototype;

    const originalDrag = WorkspaceDragger?.drag;
    const originalSetScale = workspace.setScale.bind(workspace);
    const originalScrollSet = ScrollbarPair?.set;
    const originalEndDrag = BlockDragger?.endBlockDrag;
    const originalUpdateIntersectionObserver = BlockSvgProto.updateIntersectionObserver;
    const originalSetEditingTarget = vm.setEditingTarget.bind(vm);
    const originalConnect_ = Connection?.connect_;
    const originalDisconnectInternal_ = Connection?.disconnectInternal_;
    let originalConnectMarker: any = null;
    let originalDisconnectMarker: any = null;

    if (WorkspaceDragger && originalDrag) {
      WorkspaceDragger.drag = function (d: any) {
        renderer.pauseInteractions();
        originalDrag.call(this, d);
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

    if (Connection) {
      Connection.connect_ = function (childConnection: any) {
        const childBlock = childConnection.sourceBlock_;
        const oldRoot = childBlock ? childBlock.getRootBlock() : null;
        originalConnect_.call(this, childConnection);
        renderer.clearPixiForRoot(this.sourceBlock_.getRootBlock());
        if (oldRoot && oldRoot !== this.sourceBlock_.getRootBlock()) {
          renderer.clearPixiForRoot(oldRoot);
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
      if (isCollab) {
        disposeOffscreenCache(targetId);
        console.log('清理旧缓存');
      }
      renderer.cancelBake();
      const result = originalSetEditingTarget(targetId);
      requestAnimationFrame(() => {
        renderer.fullRefresh(targetId, isCollab);
      });
      return result;
    };

    (window as any).__PIXI_REFRESH_OVERLAY__ = () => {
      renderer.syncView();
      renderer.fullRefresh();
    };

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
      if (InsertionMarkerManager) {
        InsertionMarkerManager.prototype.connectMarker_ = originalConnectMarker;
        InsertionMarkerManager.prototype.disconnectMarker_ = originalDisconnectMarker;
      }
      if (Connection) {
        Connection.connect_ = originalConnect_;
        Connection.disconnectInternal_ = originalDisconnectInternal_;
      }
      vm.setEditingTarget = originalSetEditingTarget;
      delete (window as any).__PIXI_REFRESH_OVERLAY__;

      const allBlocks = workspace.getAllBlocks(false);
      for (const block of allBlocks) {
        if (block.svgGroup_) {
          (block.svgGroup_.style as any).contentVisibility = "";
          block.svgGroup_.style.display = "";
        }
      }
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

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (targetId && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      handleSelectGroup(ALL_GROUPS_ID);
    }
  }, [targetId]);

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
                  <button className={styles.addButton} onClick={downloadCleanedProject}>
                    {msg('plugins.editorOptimization.downloadCleanProject')}
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

// 外层延迟
const EditorOptimization: React.FC<PluginContext> = (props) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('延迟....')
    const timer = setTimeout(() => {
      setReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return <EditorOptimizationInner {...props} />;
};

EditorOptimization.displayName = "EditorOptimization";
export default EditorOptimization;