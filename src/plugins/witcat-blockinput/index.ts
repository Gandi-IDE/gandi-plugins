import React from "react";
import BlockinputIcon from "assets/icon--witcat-blockinput.svg";
import { createBlockTextareaElement } from "./textarea";

function splitStringIntoLines(inputString: string, charactersPerLine: number): Array<string> {
  const regex = new RegExp(".{1," + charactersPerLine + "}", "g");
  return inputString.match(regex) || [];
}

const DEFAULT_TEXT_MAX_LENGTH = 20;
const DEFAULT_MAX_STRING_LENGTH = 50;

const WitcatBlockinput = ({ registerSettings, msg, workspace, blockly }: PluginContext) => {
  let maxStringLength = DEFAULT_MAX_STRING_LENGTH;
  let disposeBlockTextarea = null;
  let disposeOutputShapeChange = null;
  let disposeMultilineText = null;
  let textAlign = "center";

  const getToolboxAndWorkspaceBlocks = () => {
    const toolbox = workspace.getToolbox();
    return toolbox.flyout_.getWorkspace().getAllBlocks().concat(workspace.getAllBlocks());
  };

  const convertInputToTextarea = () => {
    blockly.FieldTextInput.htmlInput_.blur();
    blockly.WidgetDiv.DIV.style.display = "none";
    createBlockTextareaElement(
      msg("plugins.witcatBlockinput.title"),
      blockly.FieldTextInput.htmlInput_.defaultValue,
      blockly.FieldTextInput.htmlInput_.value,
      (value) => {
        if (blockly.FieldTextInput.htmlInput_) {
          blockly.FieldTextInput.htmlInput_.value = value;
          blockly.WidgetDiv.hide();
          blockly.DropDownDiv.hideWithoutAnimation();
        }
      },
      textAlign,
    );
  };

  const useMultilineText = () => {
    const originalRenderFunc = blockly.FieldTextInput.prototype.render_;
    const originUpdateWidthTextFunc = blockly.FieldTextInput.prototype.updateWidth;
    blockly.FieldTextInput.prototype.updateWidth = function () {
      this.textElement_.innerHTML = "";
      const texts = splitStringIntoLines(this.getDisplayText_(), maxStringLength);
      for (let index = 0; index < texts.length; index++) {
        const text = texts[index];
        const tspan = document.createElementNS(blockly.SVG_NS, "tspan");
        tspan.textContent = text;
        if (index > 0) {
          tspan.setAttribute("dy", "16");
        }
        tspan.setAttribute("x", "0");
        this.textElement_.appendChild(tspan);
      }

      this.size_.height = 16 * (texts.length + 1);
      this.size_.width = this.textElement_.firstChild.getComputedTextLength();

      this.arrowWidth_ = 0;
      if (this.positionArrow) {
        this.arrowWidth_ = this.positionArrow(this.size_.width);
        this.size_.width += this.arrowWidth_;
      }
    };
    blockly.FieldTextInput.prototype.render_ = function () {
      originalRenderFunc.call(this);
      if (this.textElement_) {
        for (const iterator of this.textElement_.children) {
          iterator.setAttribute("x", this.textElement_.getAttribute("x"));
        }
      }
    };
    disposeMultilineText = () => {
      blockly.FieldTextInput.prototype.render_ = originalRenderFunc;
      blockly.FieldTextInput.prototype.updateWidth = originUpdateWidthTextFunc;
    };
  };

  const useSquareOutputShape = () => {
    const originalJsonInit = blockly.Block.prototype.jsonInit;
    blockly.Block.prototype.jsonInit = function (json: Record<string, unknown>) {
      if (this.type === "text") {
        originalJsonInit.call(this, {
          ...json,
          outputShape: blockly.OUTPUT_SHAPE_SQUARE,
        });
      } else {
        originalJsonInit.call(this, json);
      }
    };
    disposeOutputShapeChange = () => {
      blockly.Block.prototype.jsonInit = originalJsonInit;
    };
  };

  const useBlockTextarea = () => {
    const originShowEditorFunc = blockly.FieldTextInput.prototype.showEditor_;
    blockly.FieldTextInput.prototype.showEditor_ = function (...args: unknown[]) {
      originShowEditorFunc.call(this, ...args);
      // 如果长度超过 20， 就显示自定义输入框
      if (blockly.FieldTextInput.htmlInput_.value.length > maxStringLength) {
        convertInputToTextarea();
      }
    };
    const originHtmlInputChangeFunc = blockly.FieldTextInput.prototype.onHtmlInputChange_;
    blockly.FieldTextInput.prototype.onHtmlInputChange_ = function (...args: unknown[]) {
      originHtmlInputChangeFunc.call(this, ...args);
      // 如果长度超过 20， 就显示自定义输入框
      if (blockly.FieldTextInput.htmlInput_.value.length > maxStringLength) {
        convertInputToTextarea();
      }
    };

    disposeBlockTextarea = () => {
      blockly.FieldTextInput.prototype.showEditor_ = originShowEditorFunc;
      blockly.FieldTextInput.prototype.onHtmlInputChange_ = originHtmlInputChangeFunc;
      disposeBlockTextarea = null;
    };
  };

  const register = registerSettings(
    msg("witcat.blockinput.title"),
    "witcat-blockinput",
    [
      {
        key: "enabledFunctions",
        label: msg("witcat.blockinput.title"),
        description: msg("witcat.blockinput.description"),
        items: [
          {
            key: "start",
            label: msg("witcat.blockinput.option.start"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              if (value) {
                useBlockTextarea();
              } else if (disposeBlockTextarea) {
                disposeBlockTextarea();
              }
            },
          },
          {
            key: "show",
            type: "input",
            inputProps: {
              type: "number",
            },
            label: msg("witcat.blockinput.option.show"),
            value: DEFAULT_MAX_STRING_LENGTH,
            onChange: (value: number) => {
              maxStringLength = Number(value) > 0 ? Number(value) : DEFAULT_MAX_STRING_LENGTH;
            },
          },
          {
            key: "linetext",
            label: msg("witcat.blockinput.option.linetext"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              if (value) {
                useMultilineText();
              } else if (disposeBlockTextarea) {
                disposeMultilineText();
              }
            },
          },
          {
            key: "border",
            label: msg("witcat.blockinput.option.border"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              if (value) {
                useSquareOutputShape();
              } else if (disposeBlockTextarea) {
                disposeOutputShapeChange();
              }
              getToolboxAndWorkspaceBlocks().forEach((block) => {
                if (block.type === "text") {
                  block.setOutputShape(value ? blockly.OUTPUT_SHAPE_SQUARE : blockly.OUTPUT_SHAPE_ROUND);
                  block.render();
                }
              });
            },
          },
          {
            key: "textalign",
            label: msg("witcat.blockinput.option.textalign"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              textAlign = value ? "left" : "center";
            },
          },
          {
            key: "hide",
            type: "input",
            inputProps: {
              type: "number",
              onPressEnter: (e) => {
                (e.target as HTMLInputElement).blur();
              },
              onBlur: (e) => {
                blockly.BlockSvg.MAX_DISPLAY_LENGTH = Number(e.target.value) > 0 ? Number(e.target.value) : Infinity;
                getToolboxAndWorkspaceBlocks().forEach((block) => {
                  if (block.type === "text") {
                    const inputBlock = block.inputList[0].fieldRow[0];
                    inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LENGTH;
                    inputBlock.setVisible(false);
                    inputBlock.setVisible(true);
                    block.render();
                  }
                });
              },
            },
            label: msg("witcat.blockinput.option.hide"),
            value: DEFAULT_TEXT_MAX_LENGTH,
          },
        ],
      },
    ],
    React.createElement(BlockinputIcon),
  );

  // 默认开启
  useBlockTextarea();
  useSquareOutputShape();
  useMultilineText();
  getToolboxAndWorkspaceBlocks().forEach((block) => {
    if (block.type === "text") {
      const inputBlock = block.inputList[0].fieldRow[0];
      inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LENGTH;
      inputBlock.setVisible(false);
      inputBlock.setVisible(true);
      block.setOutputShape(blockly.OUTPUT_SHAPE_SQUARE);
      block.render();
    }
  });
  return {
    dispose: () => {
      disposeBlockTextarea?.();
      disposeOutputShapeChange?.();
      disposeMultilineText?.();
      getToolboxAndWorkspaceBlocks().forEach((block) => {
        if (block.type === "text") {
          const inputBlock = block.inputList[0].fieldRow[0];
          inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LENGTH;
          inputBlock.setVisible(false);
          inputBlock.setVisible(true);
          block.setOutputShape(blockly.OUTPUT_SHAPE_ROUND);
          block.render();
        }
      });
      register.dispose();
    },
  };
};

export default WitcatBlockinput;
