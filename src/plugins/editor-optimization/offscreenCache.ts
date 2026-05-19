/**
 * offscreenCache.ts
 * 离屏 Workspace 缓存模块 v5 (Final)
 * - 移除 frame_ 的显式置空，避免拖拽空指针
 * - 移除无用的 refreshFramesOnWorkspace
 */
import toast from "react-hot-toast";
import fastdom from 'fastdom';
const hiddenWorkspaceCache = new Map<string, any>();

export function createHiddenWorkspace(blockly: any, mainWorkspace: any) {
  const injectionDiv = mainWorkspace.getInjectionDiv();
  const parentDiv = injectionDiv?.parentNode || document.body;

  const hiddenDiv = document.createElement('div');
  hiddenDiv.style.display = 'none';
  hiddenDiv.style.position = 'absolute';
  hiddenDiv.style.width = '100%';
  hiddenDiv.style.height = '100%';
  parentDiv.appendChild(hiddenDiv);

  const options = {
    ...mainWorkspace.options,
    gridPattern: mainWorkspace.options.gridPattern,
    gridOptions: mainWorkspace.options.gridOptions,
    parentWorkspace: null,
    toolbox: null,
    trashcan: false,
    zoom: mainWorkspace.options.zoom,
    comments: mainWorkspace.options.comments,
    collapse: mainWorkspace.options.collapse,
    readOnly: false,
    maxBlocks: Infinity,
  };

  const BlocklyWorkspaceSvg = blockly.WorkspaceSvg;
  const hiddenWs = new BlocklyWorkspaceSvg(options, undefined, undefined);
  hiddenWs.createDom(hiddenDiv);
  return hiddenWs;
}

export function copyVariables(srcWs: any, dstWs: any, blockly: any) {
  const vars = srcWs.getVariablesOfType('') || [];
  blockly.Events.disable();
  try {
    vars.forEach((v: any) => {
      if (!dstWs.getVariableById(v.getId())) {
        dstWs.createVariable(v.name, v.type, v.getId(), v.isLocal, v.isCloud);
      }
    });
  } finally {
    blockly.Events.enable();
  }
}

function updateWorkspaceRefRecursive(
  block: any,
  srcWs: any,
  dstWs: any,
  blockly: any
) {
  if (srcWs.intersectionObserver) {
    srcWs.intersectionObserver.unobserve(block);
  }

  // 从旧 workspace 的 blockDB_ 移除
  delete srcWs.blockDB_[block.id];
  // 添加到新 workspace 的 blockDB_
  dstWs.blockDB_[block.id] = block;

  block.workspace = dstWs;

  const connections = block.getConnections_(true);
  connections.forEach((conn: any) => {
    // 从离屏工作区恢复时，连接一定不在任何数据库中，跳过昂贵的移除操作
    conn.inDB_ = false; // 确保干净，避免后续混淆
    conn.db_ = dstWs.connectionDBList[conn.type] || null;
    const oppositeType = blockly.OPPOSITE_TYPE[conn.type];
    conn.dbOpposite_ = oppositeType !== undefined
      ? dstWs.connectionDBList[oppositeType]
      : null;
    conn.hidden_ = !conn.db_;
    if (conn.db_) {
      conn.db_.addConnection(conn);
    }
  });

  const children = block.getChildren(false);
  children.forEach((child: any) =>
    updateWorkspaceRefRecursive(child, srcWs, dstWs, blockly)
  );
}
// 准备搬运一棵积木树：更新引用、连接数据库，但不移动 SVG
function prepareBlockTreeForMove(rootBlock: any, srcWs: any, dstWs: any, blockly: any) {
  rootBlock.unplug(false);
  srcWs.removeTopBlock(rootBlock);
  updateWorkspaceRefRecursive(rootBlock, srcWs, dstWs, blockly);
}

// 挂载一棵积木树的 SVG 到目标工作区并注册为顶层积木
function attachBlockTreeToWorkspace(rootBlock: any, dstWs: any) {
  const svgRoot = rootBlock.getSvgRoot();
  if (svgRoot && svgRoot.parentNode) {
    svgRoot.parentNode.removeChild(svgRoot);
  }
  dstWs.getCanvas().appendChild(svgRoot);
  dstWs.addTopBlock(rootBlock);
}

// 原有的单棵搬移函数（现在合并上面两步，用于单独搬移场景）
export function moveBlockTreeToWorkspace(
  rootBlock: any,
  srcWs: any,
  dstWs: any,
  blockly: any
) {
  prepareBlockTreeForMove(rootBlock, srcWs, dstWs, blockly);
  attachBlockTreeToWorkspace(rootBlock, dstWs);
}

export function moveAllTopBlocksToWorkspace(
  srcWs: any,
  dstWs: any,
  blockly: any,
  skipRender = false
) {
  blockly.Events.disable();
  try {
    copyVariables(srcWs, dstWs, blockly);
    const topBlocks = [...srcWs.getTopBlocks(false)];

    // 第一阶段：准备所有积木（不移动 DOM）
    topBlocks.forEach((block: any) => prepareBlockTreeForMove(block, srcWs, dstWs, blockly));

    // 第二阶段：一次性将所有 SVG 根移入目标画布（减少样式重排）
    const canvas = dstWs.getCanvas();
    topBlocks.forEach((block: any) => {
      const svgRoot = block.getSvgRoot();
      if (svgRoot && svgRoot.parentNode) svgRoot.parentNode.removeChild(svgRoot);
      canvas.appendChild(svgRoot);
      dstWs.addTopBlock(block);
    });

    if (!skipRender) {
      // 只需轻量更新滚动条原点
      if (dstWs.setScrollbarOrigin_) dstWs.setScrollbarOrigin_();
    }
  } finally {
    blockly.Events.enable();
  }
}

export function getOffscreenWorkspace(targetId: string) {
  return hiddenWorkspaceCache.get(targetId);
}

export function ensureOffscreenWorkspace(
  targetId: string,
  blockly: any,
  mainWorkspace: any
) {
  if (hiddenWorkspaceCache.has(targetId)) return hiddenWorkspaceCache.get(targetId);
  const hiddenWs = createHiddenWorkspace(blockly, mainWorkspace);
  hiddenWorkspaceCache.set(targetId, hiddenWs);
  return hiddenWs;
}

export function saveTargetToOffscreen(
  targetId: string,
  mainWs: any,
  blockly: any
) {
  const hiddenWs = ensureOffscreenWorkspace(targetId, blockly, mainWs);
  copyVariables(mainWs, hiddenWs, blockly);

  blockly.Events.disable();
  try {
    const topBlocks = [...mainWs.getTopBlocks(false)];
    topBlocks.forEach((block: any) => lightMoveBlockTreeToOffscreen(block, mainWs, hiddenWs));

    // 搬移注释（保持不变）
    moveCommentsToWorkspace(mainWs, hiddenWs, blockly);

    // 一次性清空 IntersectionObserver 的观察列表，避免数千次 unobserve 调用
    if (mainWs.intersectionObserver) {
      mainWs.intersectionObserver.observing = [];
    }
  } finally {
    blockly.Events.enable();
  }
}

export function restoreTargetFromOffscreen(
  targetId: string,
  mainWs: any,
  blockly: any,
  activeGroupId: string,
  getBlockGroup: (block: any) => string,
  allGroupsId: string
) {
  const hiddenWs = getOffscreenWorkspace(targetId);
  if (!hiddenWs) return false;

  copyVariables(hiddenWs, mainWs, blockly);

  const allTopBlocks = [...hiddenWs.getTopBlocks(false)];
  const toMove: any[] = [];
  allTopBlocks.forEach((block: any) => {
    const groupId = getBlockGroup(block);
    if (activeGroupId === allGroupsId || groupId === activeGroupId) {
      toMove.push(block);
    }
  });
  if (toMove.length === 0) return false;
  // 如果启用了 Pixi 渲染，设置 contentVisibility: hidden 以绕过重排

  if ((window as any).__ENABLE_PIXI_OPTIMIZATION__) {
    const setContentVisibilityHidden = (block: any) => {
      if (block.svgGroup_) {
        (block.svgGroup_.style as any).contentVisibility = 'hidden';
      }
      const children = block.getChildren(false);
      for (let i = 0; i < children.length; i++) {
        setContentVisibilityHidden(children[i]);
      }
    };
    toMove.forEach((b: any) => setContentVisibilityHidden(b));
  }
  blockly.Events.disable();
  try {
    toMove.forEach((block: any) => prepareBlockTreeForMove(block, hiddenWs, mainWs, blockly));
    const canvas = mainWs.getCanvas();
    toMove.forEach((block: any) => {
      const svgRoot = block.getSvgRoot();
      if (svgRoot && svgRoot.parentNode) svgRoot.parentNode.removeChild(svgRoot);
      canvas.appendChild(svgRoot);
      mainWs.addTopBlock(block);
    });

    // 强制重置 intersects_ 并清除隐藏样式
    /*不再强制显示所有积木，保留离屏时的 intersects_ 状态，(即注释掉)
    const allBlocks = mainWs.getAllBlocks(false);
    allBlocks.forEach((b: any) => {
      b.intersects_ = true;
      const svgRoot = b.getSvgRoot();
      if (svgRoot) svgRoot.style.display = '';
    });
    */
    // 搬移注释
    moveCommentsToWorkspace(hiddenWs, mainWs, blockly);
    // 手动设置 blocksArea_ 为画布的真实矩形（轻量，不触发全量重排）
    /*但这里其实有大宗重排，所以被注掉了。
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      mainWs.blocksArea_ = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        contains: function(x: number, y: number) {
          return x >= this.left && x <= this.left + this.width &&
                 y >= this.top && y <= this.top + this.height;
        }
      };
    }
    */
    // 屏蔽昂贵的 recordCachedAreas，避免覆盖手动设置的区域
    if (!origRecordCachedAreas) {
      origRecordCachedAreas = mainWs.recordCachedAreas;
    }
    mainWs.recordCachedAreas = function() {};
    //直接更新，避免坐标出错。
    endFastRestorePhase(mainWs);
    // 自动居中，消除镜头闪现
    /*改用fastdom了所以暂时注掉
    if (typeof mainWs.scrollCenter === 'function') {
      queueMicrotask(() => {
        try {
          if (mainWs.rendered) {
            mainWs.scrollCenter();
          }
        } catch (e) {
          // 忽略
        }
      });
    }*/
        //重建连接数据库（修复拖拽连接报错的问题）
    if (mainWs.connectionDBList) {
      mainWs.connectionDBList.forEach((db: any) => {
        if (db) db.connections_ = [];
      });
      const allBlocks = mainWs.getAllBlocks(false);
      allBlocks.forEach((b: any) => {
        const connections = b.getConnections_(true);
        connections.forEach((conn: any) => {
          conn.inDB_ = false;
          const db = mainWs.connectionDBList[conn.type];
          if (db) db.addConnection(conn);
        });
      });
    }

    if (!(window as any).__ENABLE_PIXI_OPTIMIZATION__) {
      // 强制将所有积木重置为可见，以便 Observer 重新检测
      const allBlocks = mainWs.getAllBlocks(false);
      allBlocks.forEach((b: any) => {
        b.intersects_ = true;
        const svgRoot = b.getSvgRoot();
        if (svgRoot) svgRoot.style.display = '';
      });

      //将顶层积木加入观察列表，并立即执行一次离屏检查
      const topBlocks = mainWs.getTopBlocks(false);
      if (mainWs.intersectionObserver) {
        topBlocks.forEach((b: any) => {
          if (!mainWs.intersectionObserver.observing.includes(b)) {
            mainWs.intersectionObserver.observe(b);
          }
        });
        mainWs.intersectionObserver.checkForIntersections();
      }
    }
  } finally {
    blockly.Events.enable();
  }
  return true;
}
//
export function switchGroup(
  targetId: string,
  newGroupId: string,
  mainWs: any,
  blockly: any,
  getBlockGroup: (block: any) => string,
  allGroupsId: string
) {
  const hiddenWs = getOffscreenWorkspace(targetId);
  if (!hiddenWs) throw new Error('Cannot switch group without offscreen cache');

  saveTargetToOffscreen(targetId, mainWs, blockly);
  restoreTargetFromOffscreen(
    targetId,
    mainWs,
    blockly,
    newGroupId,
    getBlockGroup,
    allGroupsId
  );
}

export function initTargetCacheAndSwitchToGroup(
  targetId: string,
  mainWs: any,
  blockly: any,
  activeGroupId: string,
  getBlockGroup: any,
  allGroupsId: string
) {
  const hiddenWs = ensureOffscreenWorkspace(targetId, blockly, mainWs);
  copyVariables(mainWs, hiddenWs, blockly);
  moveAllTopBlocksToWorkspace(mainWs, hiddenWs, blockly, true);
  restoreTargetFromOffscreen(
    targetId, mainWs, blockly, activeGroupId, getBlockGroup, allGroupsId
  );
}

export function disposeOffscreenCache(targetId: string) {
  const hiddenWs = hiddenWorkspaceCache.get(targetId);
  if (hiddenWs) {
    try {
      const top = [...hiddenWs.getTopBlocks(false)];
      top.forEach((b: any) => b.dispose(false, false));
      hiddenWs.dispose();
    } catch (e) {}
    hiddenWorkspaceCache.delete(targetId);
  }
}

let origRecordCachedAreas: any = null;
let interactionCleanup: (() => void) | null = null;

/**
 * 进入快速恢复阶段：提供假缓存区域，屏蔽 recordCachedAreas
 */
export function beginFastRestorePhase(mainWs: any) {
  // 直接创建一个对象模拟 Rect，包含 left, top, width, height 属性
  mainWs.blocksArea_ = {
    left: 0,
    top: 0,
    width: 100000,
    height: 100000,
    contains: () => true   // 如果需要，可以让 contains 永远返回 true
  };

  if (!origRecordCachedAreas) {
    origRecordCachedAreas = mainWs.recordCachedAreas;
  }
  mainWs.recordCachedAreas = function() {};

  // 注册一次性清理：第一次 mousedown/touchstart 时恢复
  const canvas = mainWs.getCanvas();
  const handler = () => {
    endFastRestorePhase(mainWs);
    canvas.removeEventListener('mousedown', handler, true);
    canvas.removeEventListener('touchstart', handler, true);
  };
  canvas.addEventListener('mousedown', handler, true);
  canvas.addEventListener('touchstart', handler, true);

  interactionCleanup = () => {
    canvas.removeEventListener('mousedown', handler, true);
    canvas.removeEventListener('touchstart', handler, true);
  };
}

/**
 * 结束快速恢复阶段：恢复 recordCachedAreas，执行一次正常的 resize
 */
export function endFastRestorePhase(mainWs: any) {
  // 恢复 recordCachedAreas 的原貌
  if (origRecordCachedAreas) {
    mainWs.recordCachedAreas = origRecordCachedAreas;
    origRecordCachedAreas = null;
  }

  // 将 resize 交给 fastdom，在 mutate 阶段执行
  // 这样 resize 内部可能触发的强制布局（如 getBoundingClientRect）就不会阻塞当前同步代码
  fastdom.mutate(() => {
    const proto = Object.getPrototypeOf(mainWs);
    if (proto && typeof proto.resize === 'function') {
      proto.resize.call(mainWs);
    }
    if (typeof mainWs.scrollCenter === 'function') {
    mainWs.scrollCenter();
    }
    // resize 完成后，立即检查一次离屏积木的可见性
    if (!(window as any).__ENABLE_PIXI_OPTIMIZATION__ && mainWs.intersectionObserver) {
      mainWs.intersectionObserver.checkForIntersections();
    }
  });

  // 清理临时交互监听器 (如果存在的话)
  if (interactionCleanup) {
    interactionCleanup();
    interactionCleanup = null;
  }
}

/**
 * 超轻量递归：仅切换 workspace、更新 blockDB_，完全不操作连接。
 * 搬入离屏时使用。连接的重建在恢复时由 updateWorkspaceRefRecursive 安全完成。
 */
function ultraLightUpdateRefForOffscreen(block: any, srcWs: any, dstWs: any) {
  // 不再逐个 unobserve，改为搬移后统一清空观察数组
  delete srcWs.blockDB_[block.id];
  dstWs.blockDB_[block.id] = block;
  block.workspace = dstWs;

  var children = block.getChildren(false);
  for (var j = 0; j < children.length; j++) {
    ultraLightUpdateRefForOffscreen(children[j], srcWs, dstWs);
  }
}

/**
 * 轻量搬移一棵树到离屏（不操作连接数据库）
 */
function lightMoveBlockTreeToOffscreen(rootBlock: any, srcWs: any, dstWs: any) {
  rootBlock.unplug(false);
  srcWs.removeTopBlock(rootBlock);
  ultraLightUpdateRefForOffscreen(rootBlock, srcWs, dstWs);
  // 移动 SVG
  const svgRoot = rootBlock.getSvgRoot();
  if (svgRoot && svgRoot.parentNode) {
    svgRoot.parentNode.removeChild(svgRoot);
  }
  dstWs.getCanvas().appendChild(svgRoot);
  dstWs.addTopBlock(rootBlock);
}

/**
 * 将源工作区的所有顶层注释移动到目标工作区（包括 DOM、数据库）
 */
export function moveCommentsToWorkspace(srcWs: any, dstWs: any, blockly: any) {
  const comments = srcWs.getTopComments?.(false) || [];
  if (!comments.length) return;

  blockly.Events.disable();
  try {
    comments.forEach((comment: any) => {
      // 从源移除
      if (srcWs.removeTopComment) {
        srcWs.removeTopComment(comment);
      }

      // 切换 workspace 引用
      comment.workspace = dstWs;

      // 移动 SVG 节点（注释位于气泡画布）
      const svgRoot = comment.getSvgRoot?.();
      if (svgRoot && svgRoot.parentNode) {
        svgRoot.parentNode.removeChild(svgRoot);
      }
      const bubbleCanvas = dstWs.getBubbleCanvas?.() || dstWs.getCanvas();
      if (svgRoot && bubbleCanvas) {
        bubbleCanvas.appendChild(svgRoot);
      }

      // 注册到目标工作区的注释数据库和顶层列表
      if (dstWs.addTopComment) {
        dstWs.addTopComment(comment);
      } else {
        dstWs.topComments_?.push(comment);
      }
      if (dstWs.commentDB_) {
        dstWs.commentDB_[comment.id] = comment;
      }

      // 从源数据库删除
      if (srcWs.commentDB_ && comment.id in srcWs.commentDB_) {
        delete srcWs.commentDB_[comment.id];
      }
    });
  } finally {
    blockly.Events.enable();
  }
}
export function clearOffscreenCache(targetId: string) {
  const hiddenWs = hiddenWorkspaceCache.get(targetId);
  if (hiddenWs) {
    try {
      // 清理积木
      const top = [...hiddenWs.getTopBlocks(false)];
      top.forEach((b: any) => b.dispose(false, false));
      // 清理注释
      const topComments = hiddenWs.getTopComments?.(false) || [];
      topComments.forEach((c: any) => c.dispose?.());
      hiddenWs.dispose();
    } catch (e) {}
    hiddenWorkspaceCache.delete(targetId);
  }
}