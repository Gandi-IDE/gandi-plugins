import { useEffect, useRef } from "react";
import { isCtrlKeyDown } from "utils/index";
import { copyBatchedElements, pasteBatchedElements } from "utils/block-helper";
import { SelectedElements } from "./useBatchSelect";

const useKeyDownOperate: (params: { blockly: any; workspace: Blockly.WorkspaceSvg; vm: VirtualMachine }) => null = ({
  blockly,
  workspace,
  vm,
}) => {
  const mousemoveRef = useRef<{ clientX: number; clientY: number }>({
    clientX: 0,
    clientY: 0,
  });

  const mousemove = (e) => {
    mousemoveRef.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const onKeyDown = (e) => {
    if (blockly.locked) {
      return;
    }
    let batchDeleteBlocks = false;
    let batchCopyBlocks = false;

    const batchSelectedElements: SelectedElements = blockly.batchSelectedElements || [{}, {}];
    const selectedBlocks = Object.values(batchSelectedElements[0]);
    const selectedFrames = Object.values(batchSelectedElements[1]);
    const selectedElements = [...selectedBlocks, ...selectedFrames];
    if (e.keyCode === 8 || e.keyCode === 46) {
      if (selectedElements.length === 0) {
        // 没有选中的元素则return
        return;
      }
      // delete and backspace
      batchDeleteBlocks = true;
    }
    if (isCtrlKeyDown(e)) {
      if (e.keyCode == 86 && blockly.clipboardBatchElements?.length > 0) {
        // 'ctrl + v'
        pasteBatchedElements(mousemoveRef.current, workspace, blockly.clipboardBatchElements, vm);
      } else if (selectedElements.length === 0) {
        // 没有批量选中的block，并且按键按到了ctrl c 或者ctrl v 清除已记录的值。
        if (e.keyCode === 67 || e.keyCode === 88) {
          blockly.clipboardBatchElements = [];
        }
        return;
      } else if (e.keyCode === 67) {
        // 'ctrl + c'
        batchCopyBlocks = true;
      } else if (e.keyCode === 88) {
        // 'ctrl + x'
        batchCopyBlocks = true;
        batchDeleteBlocks = true;
      }
    }

    if (batchCopyBlocks) {
      blockly.clipboardBatchElements = copyBatchedElements(blockly.batchSelectedElements as SelectedElements);
    }

    if (batchDeleteBlocks) {
      blockly.Events.setGroup(true);
      selectedBlocks.forEach((bl) => {
        setTimeout(function () {
          blockly.mainWorkspace.fireDeletionListeners(bl);
        });
        bl.dispose(true, true);
      });
      selectedFrames.forEach((frame) => {
        frame.dispose();
      });
      blockly.batchSelectedElements = null;
      blockly.Events.setGroup(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousemove", mousemove);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.addEventListener("mousemove", mousemove);
    };
  }, []);

  return null;
};

export default useKeyDownOperate;
