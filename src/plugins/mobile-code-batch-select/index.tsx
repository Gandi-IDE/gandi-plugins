import BatchSelectIcon from "assets/icon--batch-select.svg";
import React, { useEffect, useState, useRef } from "react";
import useBatchSelect, { SelectedElements } from "./useBatchSelect";
import useCheeryPick from "./useCheeryPick";
import useKeyDownOperate from "./useKeyDownOperate";
import useRightContextMenu from "./useRightContextMenu";
import { draggingBatchedElements } from "utils/block-helper";
import { isMac } from "lib/client-info";
import enableTouchZoom from "./touchZoom";
import styles from "./styles.less";

const mobileCodeBatchSelect: React.FC<PluginContext> = ({ blockly, registerSettings, intl, workspace, vm }) => {
  const [enabledAltDuplicate, setEnabledAltDuplicate] = useState<boolean>(true);
  const [enabledBatchSelect, setEnabledBatchSelect] = useState<boolean>(true);
  const enabledAltDuplicateRef = useRef<boolean>(false);
  const altPressedRef = useRef<boolean>(false);
  const removeTouchZoom = useRef<(() => void) | null>(null);

  const onSelectedElementsChanged = (elements: SelectedElements) => {
    blockly.batchSelectedElements = elements;
  };

  const { clearAllBoxedElements } = useBatchSelect({
    enabledBatchSelect,
    workspace,
    onSelectedElementsChanged,
    blockly,
  });

  useCheeryPick({
    enabledAltDuplicate,
    blockly,
  });

  useEffect(() => {
    enabledAltDuplicateRef.current = enabledAltDuplicate;
  }, [enabledAltDuplicate]);

  useRightContextMenu({
    workspace: workspace,
    blockly,
    clearAllBoxedElements,
    intl,
    vm,
  });

  useKeyDownOperate({ blockly, workspace, vm });

  const initDraggingBlock = () => {
    const oldStartDraggingBlock = blockly.Gesture.prototype.startDraggingBlock_;
    blockly.Gesture.prototype.startDraggingBlock_ = function (...args) {
      const e = this.mostRecentEvent_;
      if (this.targetBlock_.boxed && !(altPressedRef && enabledAltDuplicateRef.current)) {
        // 处理当前target的值应该是选中块的第一个block.
        let firstBlock = this.targetBlock_;
        while (firstBlock.parentBlock_ && blockly.batchSelectedElements[0][firstBlock.parentBlock_.id]) {
          firstBlock = firstBlock.parentBlock_;
        }
        this.targetBlock_ = Object.assign(
          firstBlock,
          draggingBatchedElements(blockly.batchSelectedElements, firstBlock),
        );
      } else {
        this.targetBlock_ = Object.assign(this.targetBlock_, {
          isBatchElement: false,
          temporaryBatchElements: null,
        });
      }
      return oldStartDraggingBlock.call(this, ...args);
    };
  };

  const initDraggingFrame = () => {
    const oldStartDraggingFrame = blockly.Gesture.prototype.startDraggingFrame_;
    blockly.Gesture.prototype.startDraggingFrame_ = function (...args) {
      if (this.startFrame_.boxed && !(this.mostRecentEvent_.altKey && enabledAltDuplicateRef.current)) {
        this.startFrame_ = Object.assign(this.startFrame_, draggingBatchedElements(blockly.batchSelectedElements));
      } else {
        this.startFrame_ = Object.assign(this.startFrame_, {
          isBatchElement: false,
          temporaryBatchElements: null,
        });
      }
      return oldStartDraggingFrame.call(this, ...args);
    };
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      //当按下的手指超过1个，便视为希望复制积木
      const event = e;

      if (event instanceof TouchEvent) {
        altPressedRef.current = event.touches.length >= 2;
      }
    };

    const handleTouchEnd = () => {
      altPressedRef.current = false;
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

  useEffect(() => {
    initDraggingBlock();
  }, []);

  useEffect(() => {
    removeTouchZoom.current = enableTouchZoom(blockly, workspace);
  }, []);

  useEffect(() => {
    initDraggingFrame();
  }, []);

  useEffect(() => {
    const register = registerSettings(
      intl.formatMessage({
        id: `plugins.mobileCodeBatchSelect.title`,
      }),
      "plugin-mobile-code-batch-select",
      [
        {
          key: "cherryPicking",
          label: intl.formatMessage({
            id: `plugins.mobileCodeBatchSelect.title`,
          }),
          description: intl.formatMessage({
            id: "plugins.mobileCodeBatchSelect.description",
          }),
          items: [
            {
              key: "altDuplicate",
              label: intl.formatMessage({
                id: "plugins.mobileCodeBatchSelect.fastCopy",
              }),
              description: intl.formatMessage(
                {
                  id: "plugins.mobileCodeBatchSelect.fastCopy.description",
                },
                {
                  code: <span className={styles.code}>{isMac ? "Option" : "Alt"}</span>,
                },
              ),
              type: "switch",
              value: true,
              onChange: (value: boolean) => {
                setEnabledAltDuplicate(value);
              },
            },
            {
              key: "ctrlGrabBlock",
              label: intl.formatMessage({
                id: "plugins.mobileCodeBatchSelect.zoomStage",
              }),
              description: intl.formatMessage(
                {
                  id: "plugins.mobileCodeBatchSelect.zoomStage.description",
                },
                {
                  code: <span className={styles.code}>{isMac ? "Command" : "Ctrl"}</span>,
                },
              ),
              type: "switch",
              value: true,
              onChange: (value: boolean) => {
                if (value) {
                  removeTouchZoom.current = enableTouchZoom(blockly, workspace);
                } else {
                  if (removeTouchZoom.current) {
                    removeTouchZoom.current();
                    removeTouchZoom.current = null;
                  }
                }
              },
            },
            {
              key: "batchSelect",
              label: intl.formatMessage({
                id: "plugins.mobileCodeBatchSelect.boxSelect",
              }),
              description: intl.formatMessage(
                {
                  id: "plugins.mobileCodeBatchSelect.boxSelect.description",
                },
                {
                  code: <span className={styles.code}>{isMac ? "Command" : "Ctrl"}</span>,
                },
              ),
              type: "switch",
              value: true,
              onChange: (value: boolean) => {
                setEnabledBatchSelect(value);
              },
            },
          ],
        },
      ],
      <BatchSelectIcon />,
    );
    return () => {
      if (removeTouchZoom.current) {
        removeTouchZoom.current();
        removeTouchZoom.current = null;
      }
      register.dispose();
    };
  }, [registerSettings]);
  return <></>;
};

mobileCodeBatchSelect.displayName = "mobileCodeBatchSelect";

export default mobileCodeBatchSelect;
