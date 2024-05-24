import BatchSelectIcon from "assets/icon--batch-select.svg";
import React, { useEffect, useState, useRef } from "react";
import useBatchSelect, { SelectedElements } from "./useBatchSelect";
import useCheeryPick from "./useCheeryPick";
import useKeyDownOperate from "./useKeyDownOperate";
import useRightContextMenu from "./useRightContextMenu";
import { draggingBatchedElements } from "utils/block-helper";
import { isMac } from "lib/client-info";
import styles from "./styles.less";

const CodeBatchSelect: React.FC<PluginContext> = ({ blockly, registerSettings, intl, workspace, vm }) => {
  const [enabledAltDuplicate, setEnabledAltDuplicate] = useState<boolean>(false);
  const [enabledCtrlGrabBlock, setEnabledCtrlGrabBlock] = useState<boolean>(false);
  const [enabledBatchSelect, setEnabledBatchSelect] = useState<boolean>(false);
  const enabledAltDuplicateRef = useRef<boolean>(false);

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
    enabledCtrlGrabBlock,
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
      if (this.targetBlock_.boxed && !(e.altKey && enabledAltDuplicateRef.current)) {
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
    initDraggingBlock();
  }, []);

  useEffect(() => {
    initDraggingFrame();
  }, []);

  useEffect(() => {
    const register = registerSettings(
      intl.formatMessage({
        id: `plugins.codeBatchSelect.title`,
      }),
      "plugin-code-batch-select",
      [
        {
          key: "cherryPicking",
          label: intl.formatMessage({
            id: `plugins.codeBatchSelect.title`,
          }),
          description: intl.formatMessage({
            id: "plugins.codeBatchSelect.description",
          }),
          items: [
            {
              key: "altDuplicate",
              label: intl.formatMessage({
                id: "plugins.codeBatchSelect.fastCopy",
              }),
              description: intl.formatMessage(
                {
                  id: "plugins.codeBatchSelect.fastCopy.description",
                },
                {
                  code: <span className={styles.code}>{isMac ? "Option" : "Alt"}</span>,
                },
              ),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                setEnabledAltDuplicate(value);
              },
            },
            {
              key: "ctrlGrabBlock",
              label: intl.formatMessage({
                id: "plugins.codeBatchSelect.fastSelect",
              }),
              description: intl.formatMessage(
                {
                  id: "plugins.codeBatchSelect.fastSelect.description",
                },
                {
                  code: <span className={styles.code}>{isMac ? "Command" : "Ctrl"}</span>,
                },
              ),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                setEnabledCtrlGrabBlock(value);
              },
            },
            {
              key: "batchSelect",
              label: intl.formatMessage({
                id: "plugins.codeBatchSelect.boxSelect",
              }),
              description: intl.formatMessage(
                {
                  id: "plugins.codeBatchSelect.boxSelect.description",
                },
                {
                  code: <span className={styles.code}>{isMac ? "Command" : "Ctrl"}</span>,
                },
              ),
              type: "switch",
              value: false,
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
      register.dispose();
    };
  }, [registerSettings]);
  return <></>;
};

export default CodeBatchSelect;
