const enableTouchZoom = (blockly: any, workspace: Blockly.WorkspaceSvg) => {
  let lastDist = 0;
  let isZooming = false;

  // 计算双指中心点
  const getTouchCenter = (touches: TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  // 计算双指距离
  const getTouchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 记录上一次点击的时间和位置
  let lastTapTime = 0;
  let lastTapPos = { x: 0, y: 0 };
  let allowDrag = true;

  document.addEventListener(
    "touchstart",
    (event) => {
      const now = Date.now();
      const touch = event.changedTouches[0]; // 取第一个触摸点
      const tapPos = { x: touch.clientX, y: touch.clientY };

      // 检测是否是双击（时间间隔 < 300ms，且位置变化不大）
      const isDoubleTap =
        now - lastTapTime < 300 && Math.abs(tapPos.x - lastTapPos.x) < 20 && Math.abs(tapPos.y - lastTapPos.y) < 20;

      if (isDoubleTap) {
        allowDrag = false;
        return; // 直接返回，不执行 `originalStartDrag`
      }

      // 更新上一次点击的时间和位置
      lastTapTime = now;
      lastTapPos = tapPos;
    },
    { capture: true },
  );

  document.addEventListener(
    "touchend",
    () => {
      if (!allowDrag) {
        allowDrag = true;
      }
    },
    {
      capture: true,
    },
  );

  // 劫持 `startDrag`
  const originalStartDrag = blockly.WorkspaceDragger.prototype.startDrag;
  blockly.WorkspaceDragger.prototype.startDrag = function () {
    const event = window.event;

    if (event instanceof TouchEvent) {
      // 检测双指缩放
      if (event.touches.length === 2) {
        isZooming = true;
        lastDist = getTouchDistance(event.touches);
      }
    }

    return originalStartDrag.call(this);
  };

  // 劫持 `drag`
  const originalDrag = blockly.WorkspaceDragger.prototype.drag;
  blockly.WorkspaceDragger.prototype.drag = function (currentDragDeltaXY) {
    if (!allowDrag) {
      return;
    }
    if (!isZooming && window.event instanceof TouchEvent && window.event.touches.length === 2) {
      isZooming = true;
    }
    if (isZooming && window.event instanceof TouchEvent && window.event.touches.length === 2) {
      const newDist = getTouchDistance(window.event.touches);
      const newCenter = getTouchCenter(window.event.touches);
      const scaleSpeed = (newDist - lastDist) * 0.01 * 2; // 放大缩小的速度

      const position = blockly.utils.mouseToSvg(
        { clientX: newCenter.x, clientY: newCenter.y },
        workspace.getParentSvg(),
        workspace.getInverseScreenCTM(),
      );
      workspace.zoom(position.x, position.y, scaleSpeed);
      lastDist = newDist;
      return;
      //return originalDrag.call(this, getTouchCenterDistance());
      //你猜为啥要注释掉，因为几把的scratch不能同时缩放和拖动，你敢同时，它就敢给你（缩放中心点）坐标炸掉！
    } else {
      return originalDrag.call(this, currentDragDeltaXY);
    }
  };

  // 劫持 `endDrag`
  const originalEndDrag = blockly.WorkspaceDragger.prototype.endDrag;
  blockly.WorkspaceDragger.prototype.endDrag = function (currentDragDeltaXY) {
    if (!allowDrag) {
      allowDrag = true;
      return;
    }
    if (isZooming) {
      isZooming = false;
      return;
      // return originalEndDrag.call(this, getTouchCenterDistance());
    } else {
      return originalEndDrag.call(this, currentDragDeltaXY);
    }
  };

  return () => {
    blockly.WorkspaceDragger.prototype.startDrag = originalStartDrag;
    blockly.WorkspaceDragger.prototype.drag = originalDrag;
    blockly.WorkspaceDragger.prototype.endDrag = originalEndDrag;
  };
};

export default enableTouchZoom;
