export const isCtrlKeyDown = (event): boolean => {
  return /macintosh|mac os x/i.test(navigator.userAgent) ? event.metaKey : event.ctrlKey;
};

const controlBorder = {
  top: 56,
  bottom: 40,
  left: 16,
};

export const isOverlap = (
  rect1: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  rect2: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  isControlBlock: boolean,
  workspace: { scale?: number },
) => {
  // 计算两个矩形的四个边界
  const left1 = rect1.x;
  const right1 = rect1.x + rect1.width;
  const top1 = rect1.y;
  const bottom1 = rect1.y + rect1.height;

  const left2 = rect2.x;
  const right2 = rect2.x + rect2.width;
  const top2 = rect2.y;
  const bottom2 = rect2.y + rect2.height;
  // 判断是否有重叠
  if (left1 > right2 || left2 > right1 || top1 > bottom2 || top2 > bottom1) {
    return false;
  } else {
    // control 类型的block跳过设置
    if (isControlBlock) {
      const blockLeft = left1 + controlBorder.left * workspace.scale;
      const blockTop = top1 + controlBorder.top * workspace.scale;
      const blockBottom = bottom1 - controlBorder.bottom * workspace.scale;
      if (left2 > blockLeft && blockBottom > bottom2 && blockTop < top2) {
        return false;
      }
      return true;
    }
    return true;
  }
};
