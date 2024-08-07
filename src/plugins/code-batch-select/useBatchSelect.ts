import { useEffect, useRef, useCallback } from "react";
import { isCtrlKeyDown, isOverlap } from "utils/index";
import { getChildBlocks } from "utils/block-helper";
import { debounce } from "lodash-es";
const blocklyWorkspaceClassName = ".blocklySvg";

type BlocksAndFramesList = [Array<Blockly.Block>, Array<Blockly.Frame>];
export type SelectedElements = [Record<string, Blockly.Block>, Record<string, Blockly.Frame>];

const useBatchSelect: (params: {
  enabledBatchSelect?: boolean;
  workspace: Blockly.WorkspaceSvg;
  onSelectedElementsChanged(elements: SelectedElements): void;
  blockly?: any;
}) => {
  clearAllBoxedElements: (isDelete?: boolean) => void;
} = ({ enabledBatchSelect, workspace, onSelectedElementsChanged, blockly }) => {
  const blocklyBlocksSvgNode = useRef<Element>(document.querySelector(blocklyWorkspaceClassName));
  const selectedElementsRef = useRef<SelectedElements>([{}, {}]);
  const drawPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mousemoveRef = useRef<number>(0);
  const selectableElements = useRef<BlocksAndFramesList>([[], []]);
  const rectNode = useRef<SVGRectElement>();

  const setFrameHighlight = useCallback((frame: Blockly.Frame, visible: boolean) => {
    const svgGroup = frame.getSvgRoot();
    if (svgGroup) {
      if (visible) {
        svgGroup.classList.add("blocklyFrameHighlight");
        frame.boxed = true;
        frame.selected = true;
      } else {
        svgGroup.classList.remove("blocklyFrameHighlight");
        frame.boxed = false;
        frame.selected = false;
      }
    }
  }, []);

  const setBlockStatusAndStyles = (block: Blockly.Block, status: boolean, onlyStyle?: boolean) => {
    if (status) {
      block.svgPath_.setAttribute("fill-opacity", "0.4");
      if (!onlyStyle) {
        block.boxed = true;
      }
      // 设置block的 input / select 等 blocks的样式
      block.childBlocks_?.forEach((clb) => {
        if (clb.isShadow_) {
          clb.svgPath_.setAttribute("fill-opacity", "0.4");
          if (!onlyStyle) {
            clb.boxed = true;
          }
        }
      });
      block.inputList?.forEach((ipt) => {
        if (ipt.name === "CONDITION") {
          ipt.outlinePath?.setAttribute("fill-opacity", "0.4");
        }
        ipt.fieldRow?.forEach((fld) => {
          if (fld.argType_ && fld.argType_.length > 0 && fld.box_) {
            fld.box_.setAttribute("fill-opacity", "1");
          }
        });
      });
      return;
    }
    block.svgPath_.setAttribute("fill-opacity", "1");
    if (!onlyStyle) {
      block.boxed = false;
    }
    block.childBlocks_?.forEach((clb) => {
      if (clb.isShadow_) {
        clb.svgPath_.setAttribute("fill-opacity", "1");
        if (!onlyStyle) {
          clb.boxed = false;
        }
      }
    });
    block.inputList?.forEach((ipt) => {
      if (ipt.name === "CONDITION") {
        ipt.outlinePath?.setAttribute("fill-opacity", "0.4");
      }
      ipt.fieldRow?.forEach((fld) => {
        if (fld.argType_ && fld.argType_.length > 0 && fld.box_) {
          fld.box_.setAttribute("fill-opacity", "1");
        }
      });
    });
  };

  // Record the current selectionable elements (such as Block and Frame).
  const updateSelectableElements = () => {
    const list: BlocksAndFramesList = [[], []];
    list[0] = workspace.getAllBlocks().filter((it) => !it.isShadow_ && it.intersects_);
    list[1] = workspace.getTopFrames();
    list[0].forEach((block) => {
      if (block.svgPath_) {
        const rect = block.svgPath_.getBBox();
        const svgGroup = block.getSvgRoot();

        block.temporaryCoordinate = {
          ...workspace.getSvgXY(svgGroup),
          width: rect.width * workspace.scale,
          height: rect.height * workspace.scale,
        };
      }
    });
    list[1].forEach((frame) => {
      frame.temporaryCoordinate = {
        ...workspace.getSvgXY(frame.svgRect_),
        width: frame.getWidth() * workspace.scale,
        height: frame.getHeight() * workspace.scale,
      };
    });
    selectableElements.current = list;
  };

  // Clear all highlighted styles of elements that are selected by the bounding box.
  const clearAllBoxedElements = useCallback(
    (isDelete?: boolean) => {
      if (!isDelete) {
        selectableElements.current[0].forEach((block) => {
          if (block.svgPath_) {
            block.svgPath_.setAttribute("fill-opacity", "1");
            block.boxed = false;
            block.childBlocks_?.forEach((clb) => {
              if (!clb.category_) {
                clb.svgPath_.setAttribute("fill-opacity", "1");
                clb.boxed = false;
              }
            });
          }
        });
        selectableElements.current[1].forEach((frame) => {
          setFrameHighlight(frame, false);
        });
      }
      selectedElementsRef.current = [{}, {}];
      selectableElements.current = [[], []];
      onSelectedElementsChanged(selectedElementsRef.current);
    },
    [setFrameHighlight],
  );

  const calculateBlockActivity = debounce((rect2) => {
    const selectedBlocksSet: Set<string> = new Set();
    const selectedBlocks: Record<string, Blockly.Block> = {};
    const selectedFrames: Record<string, Blockly.Frame> = {};
    selectableElements.current[0].forEach((block) => {
      if (block.isSelectable()) {
        const { temporaryCoordinate } = block;
        if (
          temporaryCoordinate &&
          isOverlap(temporaryCoordinate, rect2, block.category_ === "control", workspace.scale)
        ) {
          selectedBlocks[block.id] = block;
          if (!selectedBlocksSet.has(block.id)) {
            getChildBlocks(block).forEach((id) => selectedBlocksSet.add(id));
          }
          setBlockStatusAndStyles(block, true);
        } else {
          setBlockStatusAndStyles(block, false);
        }
      }
    });
    selectableElements.current[0].forEach((block) => {
      if (selectedBlocksSet.has(block.id) && !block.boxed) {
        setBlockStatusAndStyles(block, true);
        selectedBlocks[block.id] = block;
      }
    });
    selectedElementsRef.current[0] = selectedBlocks;
    selectableElements.current[1].forEach((frame) => {
      if (frame.locked || !frame.temporaryCoordinate) return;
      let selected = false;
      const c1 = frame.temporaryCoordinate;
      const c2 = rect2;
      selected = c1.x > c2.x && c1.y > c2.y && c1.x + c1.width < c2.x + c2.width && c1.y + c1.height < c2.y + c2.height;

      setFrameHighlight(frame, selected);
      if (selected) {
        selectedFrames[frame.id] = frame;
        Object.values(selectedElementsRef.current[0]).forEach((block) => {
          if (block.isInFrame() === frame) {
            setBlockStatusAndStyles(block, false);
            delete selectedBlocks[block.id];
            setBlockStatusAndStyles(block, true, true);
          }
        });
      }
    });
    selectedElementsRef.current[1] = selectedFrames;
    onSelectedElementsChanged(selectedElementsRef.current);
  }, 80);

  const startRect = (event: MouseEvent, clearBoxed = true) => {
    clearBoxed && clearAllBoxedElements();
    updateSelectableElements();
    event.preventDefault();
    event.stopPropagation();
    const x = event.offsetX;
    const y = event.offsetY;
    drawPositionRef.current = { x, y };
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", "0");
    rect.setAttribute("height", "0");
    rect.setAttribute("fill", "rgba(45, 140, 255, 0.15)");
    rect.setAttribute("stroke", "#2D8CFF");
    rect.setAttribute("stroke-width", "2");
    rectNode.current = rect;
    blocklyBlocksSvgNode.current?.appendChild(rect);
  };

  const drawRect = (event) => {
    if (!rectNode.current) {
      return;
    }
    const workspaceRect = blocklyBlocksSvgNode.current.getBoundingClientRect();
    const offsetX = event.clientX - workspaceRect.left;
    const offsetY = event.clientY - workspaceRect.top;
    const rect = rectNode.current;
    const width = offsetX - drawPositionRef.current.x;
    const height = offsetY - drawPositionRef.current.y;
    rect.setAttribute("width", `${Math.abs(width)}`);
    rect.setAttribute("height", `${Math.abs(height)}`);
    width < 0 && rect.setAttribute("x", offsetX + "");
    height < 0 && rect.setAttribute("y", offsetY + "");
    calculateBlockActivity({
      x: +rect.getAttribute("x"),
      y: +rect.getAttribute("y"),
      width: +rect.getAttribute("width"),
      height: +rect.getAttribute("height"),
    });
  };

  // 取消选择中单个Frame
  const unselectFrameElement = useCallback((frame: Blockly.Frame, unselectBlocks = true) => {
    delete selectedElementsRef.current[1][frame.id];
    setFrameHighlight(frame, false);
    if (unselectBlocks) {
      Object.values(selectableElements.current[0]).forEach((block) => {
        if (block.isInFrame() === frame) {
          setBlockStatusAndStyles(block, false);
          delete selectedElementsRef.current[0][block.id];
        }
      });
    }
    onSelectedElementsChanged(selectedElementsRef.current);
  }, []);

  // 选择中单个Block
  const selectBlockElement = useCallback((block: Blockly.Block) => {
    const selectedBlocks = selectedElementsRef.current[0];
    selectedBlocks[block.id] = block;
    setBlockStatusAndStyles(block, true);
    getChildBlocks(block).forEach((childBlockId) => {
      const childBlock = selectableElements.current[0].find((el) => el.id === childBlockId);
      if (childBlock) {
        setBlockStatusAndStyles(childBlock, true);
        selectedBlocks[childBlock.id] = childBlock;
      }
    });
    onSelectedElementsChanged(selectedElementsRef.current);
  }, []);

  // 取消选择中单个Block.
  const unselectBlockElement = useCallback((block: Blockly.Block) => {
    // Remove the block from the active block list
    delete selectedElementsRef.current[0][block.id];
    setBlockStatusAndStyles(block, false);
    const childBlockIds = getChildBlocks(block);
    childBlockIds.forEach((blockId) => {
      const childBlock = selectedElementsRef.current[0][blockId];
      if (childBlock) {
        delete selectedElementsRef.current[0][blockId];
        setBlockStatusAndStyles(childBlock, false);
      }
    });
    onSelectedElementsChanged(selectedElementsRef.current);
  }, []);

  // 选择中单个Frame
  const selectFrameElement = useCallback((frame: Blockly.Frame) => {
    selectedElementsRef.current[1][frame.id] = frame;
    Object.values(selectableElements.current[0]).forEach((block) => {
      if (block.isInFrame() === frame) {
        setBlockStatusAndStyles(block, false);
        delete selectedElementsRef.current[0][block.id];
        setBlockStatusAndStyles(block, true, true);
      }
    });
    setFrameHighlight(frame, true);
    onSelectedElementsChanged(selectedElementsRef.current);
  }, []);

  const mousedown = (event: MouseEvent) => {
    if (blockly.locked) {
      return;
    }
    mousemoveRef.current = 0;
    const ctrlKey = isCtrlKeyDown(event);
    if (event.target && event.target instanceof SVGAElement) {
      const element = event.target.tooltip;
      const targetClassName = event.target.className.baseVal || "";
      // 当点选中已经被框选中的元素（Frame or Block）时，不做任何处理。
      if (element && (element.boxed || element.isInFrame?.()?.boxed)) {
        return;
      }

      if (targetClassName === "blocklyFrameHighlight") {
        return;
      }
      // 在 main workspace 中可以开始框选
      // 在 frame 空白处也可以开始框选
      if (ctrlKey && (targetClassName === "blocklyFrameRectangle" || targetClassName === "blocklyMainBackground")) {
        // 在frame中，鼠标按下的时候不一定是进行绘制框选，也有可能是触发单击事件进行选择
        startRect(event, targetClassName === "blocklyMainBackground");
        return;
      }
      // 使用ctrlKey并按下积木块时，也放到mouseup中处理。 通过target判断是否是积木块，目前只有积木块的target上面有tooltip
      // 新增的frame也有，但是frame应该单独处理
      if (ctrlKey && element) {
        return;
      }
      // 右键点击快捷键
      if (event.target.className?.includes?.("goog-menuitem")) {
        return;
      }
    }
    // 其他场景都消除所有的blocks
    clearAllBoxedElements();
  };

  const mouseup = (event) => {
    if (blockly.locked) {
      return;
    }
    const rectKey = isCtrlKeyDown(event);
    setTimeout(() => {
      mousemoveRef.current = 0;
    });
    const isClick = mousemoveRef.current <= 1;
    // 单个被选中的click事件：去除单个的勾选
    if (event.target?.tooltip?.boxed && rectKey && isClick) {
      const element = event.target.tooltip;
      const maybeBlock = selectedElementsRef.current[0][element.id];
      if (maybeBlock) {
        const nextConnectionBlock = maybeBlock.parentBlock_?.nextConnection?.targetConnection?.sourceBlock_;
        // 当父节点被选中时，子节点不允许被单击取消选中。
        if (maybeBlock.parentBlock_?.boxed && nextConnectionBlock?.id !== maybeBlock.id) {
          return;
        }
        let tempBlock = maybeBlock;
        // C积木中的积木要一层层的找到boxed的那一层C积木
        while (tempBlock.parentBlock_?.boxed) {
          const parentBlock_ = tempBlock.parentBlock_;
          if (parentBlock_ && parentBlock_.category_ === "control") {
            if (parentBlock_.nextConnection?.targetConnection?.sourceBlock_.id !== tempBlock.id) {
              return;
            }
          }
          tempBlock = parentBlock_;
        }
        unselectBlockElement(maybeBlock);
      }
      const maybeFrame = selectedElementsRef.current[1][element.id];
      if (maybeFrame) {
        unselectFrameElement(maybeFrame);
      }
      return;
    }
    // 单个未被选中的click事件：增加选中
    if (event.target?.tooltip && !event.target.tooltip.boxed && rectKey && isClick) {
      const element = event.target.tooltip;
      updateSelectableElements();
      const maybeBlock = selectableElements.current[0].find((i) => i.id === element.id);
      if (maybeBlock) {
        const frame = maybeBlock.isInFrame();
        if (frame && frame.boxed) {
          unselectBlockElement(maybeBlock);
          unselectFrameElement(frame, false);
          Object.values(selectableElements.current[0]).forEach((item) => {
            if (item.id !== maybeBlock.id && item.isInFrame() === frame) {
              selectBlockElement(item);
            }
          });
        } else {
          selectBlockElement(maybeBlock);
        }
      }
      const maybeFrame = selectableElements.current[1].find((i) => i.id === element.id);
      // frame的单选时移除mousedown生成的框选节点
      if (maybeFrame) {
        blocklyBlocksSvgNode.current.removeChild(rectNode.current);
        rectNode.current = null;
        selectFrameElement(maybeFrame);
      }
      return;
    }
    // 清除框选svg
    if (!rectNode.current) {
      return;
    }
    blocklyBlocksSvgNode.current.removeChild(rectNode.current);
    rectNode.current = null;
  };

  const mousemove = (event) => {
    if (blockly.locked) {
      return;
    }
    // event.preventDefault();
    mousemoveRef.current++;
    drawRect(event);
  };

  useEffect(() => {
    if (!blocklyBlocksSvgNode.current || !enabledBatchSelect) {
      return;
    }
    document.addEventListener("mousedown", mousedown, {
      capture: true,
    });
    document.addEventListener("mouseup", mouseup, {
      capture: true,
    });
    document.addEventListener("mousemove", mousemove, {
      capture: true,
    });
    return () => {
      document.removeEventListener("mousedown", mousedown, {
        capture: true,
      });
      document.removeEventListener("mouseup", mouseup, {
        capture: true,
      });
      document.removeEventListener("mousemove", mousemove, {
        capture: true,
      });
    };
  }, [enabledBatchSelect]);
  return { clearAllBoxedElements };
};

export default useBatchSelect;
