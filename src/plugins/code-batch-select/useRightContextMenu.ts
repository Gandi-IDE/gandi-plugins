import { useEffect } from "react";
import type { IntlShape } from "react-intl";
import { copyBatchedElements, pasteBatchedElements } from "utils/block-helper";
import { SelectedElements } from "./useBatchSelect";

interface IProps {
  workspace: ScratchBlocks.WorkspaceSvg;
  blockly: any;
  clearAllBoxedElements?: (boolean) => void;
  intl: IntlShape;
  vm: VirtualMachine;
}

const useBatchSelectRightMenu = ({ workspace, blockly, clearAllBoxedElements, intl, vm }: IProps) => {
  useEffect(() => {
    const menuItemId = window.Blockly.ContextMenu.addDynamicMenuItem(
      (items, element) => {
        if (element.boxed) {
          const menus = [
            {
              id: "Copy all",
              text: intl.formatMessage({
                id: "plugins.codeBatchSelect.duplicate.all",
              }),
              enabled: true,
              callback: () => {
                if (!blockly.batchSelectedElements) return;
                blockly.clipboardBatchElements = copyBatchedElements(blockly.batchSelectedElements as SelectedElements);
              },
            },
            {
              id: "Delete all",
              text: intl.formatMessage({
                id: "plugins.codeBatchSelect.delete.all",
              }),
              enabled: true,
              callback: () => {
                if (!blockly.batchSelectedElements) return;
                blockly.Events.setGroup(true);
                Object.values(blockly.batchSelectedElements[0]).forEach((bl: ScratchBlocks.Block) => {
                  setTimeout(function () {
                    blockly.mainWorkspace.fireDeletionListeners(bl);
                  });
                  bl.dispose(true, true);
                });
                Object.values(blockly.batchSelectedElements[1]).forEach((frame: ScratchBlocks.Frame) => {
                  frame.dispose();
                });
                blockly.Events.setGroup(false);
                clearAllBoxedElements(true);
              },
            },
          ];
          return items.splice(0, items.length, ...menus);
        }
        return items;
      },
      {
        targetNames: ["frame", "blocks"],
      },
    );
    return () => {
      window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
    };
  }, []);

  useEffect(() => {
    const menuItemId = window.Blockly.ContextMenu.addDynamicMenuItem(
      (items, _, event) => {
        if (blockly.clipboardBatchElements?.length > 0) {
          items.splice(2, 0, {
            id: "Paste all",
            text: intl.formatMessage({
              id: "plugins.codeBatchSelect.paste.all",
            }),
            enabled: true,
            callback: () => {
              pasteBatchedElements(event, workspace, blockly.clipboardBatchElements, vm);
            },
          });
        }
        return items;
      },
      {
        targetNames: ["workspace"],
      },
    );
    return () => {
      window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
    };
  }, []);
  return null;
};

export default useBatchSelectRightMenu;
