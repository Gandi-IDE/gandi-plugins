import { useEffect, useRef } from "react";
import { getActivityEndBlockNext } from "utils/block-helper";

const useCheeryPick = ({ enabledAltDuplicate, blockly }: { enabledAltDuplicate?: boolean; blockly?: any }) => {
  const enabledAltDuplicateRef = useRef<boolean>(false);
  const altPressedRef = useRef<boolean>(false);
  const ctrlPressedRef = useRef<boolean>(false);

  const initDraggingBlock = () => {
    const oldStartDraggingBlock = blockly.Gesture.prototype.startDraggingBlock_;
    blockly.Gesture.prototype.startDraggingBlock_ = function (...args) {
      console.log("startDraggingBlock_");
      let block = this.targetBlock_;
      // 开启按键控制功能
      if (enabledAltDuplicateRef.current) {
        if (!blockly.Events.getGroup()) {
          // Scratch will disable grouping on its own later.
          blockly.Events.setGroup(true);
        }

        // 复制block功能
        // 自定义函数不能被复制
        if (
          altPressedRef.current &&
          this.targetBlock_.type !== "procedures_definition" &&
          !this.flyout_ &&
          enabledAltDuplicateRef.current
        ) {
          this.startWorkspace_.setResizesEnabled(false);
          blockly.Events.disable();
          let newBlock;
          try {
            let nextBlock;
            if (block.boxed) {
              nextBlock = getActivityEndBlockNext(block, Object.values(blockly.batchSelectedElements[0]));
            }
            const xmlBlock = blockly.Xml.blockToDom(block, false, nextBlock?.id);
            newBlock = blockly.Xml.domToBlock(xmlBlock, this.startWorkspace_);
            blockly.scratchBlocksUtils.changeObscuredShadowIds(newBlock);
            const xy = block.getRelativeToSurfaceXY();
            newBlock.moveBy(xy.x, xy.y);
          } catch (e) {
            console.error(e);
          }
          blockly.Events.enable();

          if (newBlock) {
            block = newBlock;
            this.targetBlock_ = newBlock;
            if (blockly.Events.isEnabled()) {
              blockly.Events.fire(new blockly.Events.BlockCreate(newBlock));
            }
          }
        } else if (ctrlPressedRef.current) {
          block.unplug(true);
        }
      }
      return oldStartDraggingBlock.call(this, ...args);
    };
  };

  const initDraggingFrame = () => {
    const oldStartDraggingFrame = blockly.Gesture.prototype.startDraggingFrame_;
    blockly.Gesture.prototype.startDraggingFrame_ = function (...args) {
      const frame = this.startFrame_;
      if (enabledAltDuplicateRef.current) {
        // 复制Frame功能
        if (altPressedRef.current && !this.flyout_) {
          const newFrame = blockly.scratchBlocksUtils.duplicateFrame(frame, true);
          this.startFrame_ = newFrame;
        }
      }
      return oldStartDraggingFrame.call(this, ...args);
    };
  };

  useEffect(() => {
    initDraggingBlock();
  }, []);

  useEffect(() => {
    initDraggingFrame();
  }, []);

  useEffect(() => {
    enabledAltDuplicateRef.current = enabledAltDuplicate;
  }, [enabledAltDuplicate]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const event = e;

      if (event instanceof TouchEvent) {
        altPressedRef.current = event.touches.length >= 2;
      }
      // windows ctrl key   mac command key
      // 当文件被选中的时候ctrl 键将不支持单独拖拽出来
      ctrlPressedRef.current = false;
    };

    const handleTouchEnd = () => {
      altPressedRef.current = false;
      ctrlPressedRef.current = false;
    };
    document.addEventListener("touchstart", handleTouchStart, {
      capture: true,
    });
    document.addEventListener("touchend", handleTouchEnd, {
      capture: true,
    });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart, {
        capture: true,
      });
      document.removeEventListener("touchend", handleTouchEnd, {
        capture: true,
      });
    };
  }, []);
  return null;
};

export default useCheeryPick;
