let styleElement = document.createElement("style");
styleElement.innerHTML = `
.blocklyHtmlInput{
  text-align: center;
}
`;
document.head.appendChild(styleElement);
let textarea = "textarea",
  renderWidth = 20,
  ResizeEditorAble = false,
  lineRender = true;
// 输入框的文本的对其方式
let inputLabelTextAnchor = "middle";

const getToolboxAndWorkspaceBlocks = (workspace) => {
  const toolbox = workspace.getToolbox();
  if (toolbox) {
    return toolbox.flyout_.getWorkspace().getAllBlocks().concat(workspace.getAllBlocks());
  }
  return [];
};

const opcodeToSettings = {
  text: "text",
  argument_editor_string_number: "text",
  math_number: "number",
  math_integer: "number",
  math_whole_number: "number",
  math_positive_number: "number",
  math_angle: "number",
  note: "number",
  colour_picker: "color",
};

let borderRestoration = {
  text: false,
  number: false,
  color: false,
};

const lineText = {
  originShowEditor_: null,
  originHtmlInputKeyDown_: null,
  originalRender_: null,
  originalResizeEditor_: null,
  init: function (Blockly) {
    this.originShowEditor_ = ScratchBlocks.FieldTextInput.prototype.showEditor_;
    this.originHtmlInputKeyDown_ = ScratchBlocks.FieldTextInput.prototype.onHtmlInputKeyDown_;
    this.originalRender_ = ScratchBlocks.FieldTextInput.prototype.render_;
    this.originalResizeEditor_ = ScratchBlocks.FieldTextInput.prototype.resizeEditor_;
  },
  linerender: function (value, workspace, rerender) {
    lineRender = value;
    if (rerender !== false) {
      getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
        if (opcodeToSettings[block.type]) {
          const inputBlock = block.inputList[0].fieldRow[0];
          inputBlock.setVisible(false);
          inputBlock.setVisible(true);
          block.render();
        }
      });
    }
  },
  lineTextLeft: function (value, vm, workspace, blockly) {
    inputLabelTextAnchor = value ? "start" : "middle";
    getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
      if (opcodeToSettings[block.type]) {
        const inputBlock = block.inputList[0].fieldRow[0];
        inputBlock.setVisible(false);
        inputBlock.setVisible(true);
        block.render();
      }
    });
  },
  svgStart: function (start, workspace, blockly, type) {
    let needRerenderBlockTypes = new Set(["text", "number", "color"]);
    if (type) {
      if (borderRestoration[type] === start) {
        return;
      }
      needRerenderBlockTypes = new Set([type]);
    }
    needRerenderBlockTypes.forEach((needRerenderBlockType) => {
      borderRestoration[needRerenderBlockType] = start;
    });
    getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
      if (needRerenderBlockTypes.has(opcodeToSettings[block.type])) {
        block.setOutputShape(
          borderRestoration[opcodeToSettings[block.type]] === true
            ? blockly.OUTPUT_SHAPE_SQUARE
            : blockly.OUTPUT_SHAPE_ROUND,
        );
        block.render();
      }
    });
  },
  svg: function (Blockly) {
    const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;

    ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
      if (borderRestoration[opcodeToSettings[this.type]] === true) {
        originalJsonInit.call(this, {
          ...json,
          outputShape: ScratchBlocks.OUTPUT_SHAPE_SQUARE,
        });
      } else {
        originalJsonInit.call(this, json);
      }
    };
  },
  textLeft: function (start) {
    if (start) {
      styleElement.innerHTML = `
.blocklyHtmlInput{
  text-align: left;
}
    `;
    } else {
      styleElement.innerHTML = `
.blocklyHtmlInput{
  text-align: center;
}
    `;
    }
  },
  changTextarea: function (start) {
    textarea = start ? "textarea" : "input";
  },
  changeRenderWidth: function (width, workspace, rerender) {
    if (renderWidth === (width > 20 ? width : 20)) return;
    renderWidth = width > 20 ? width : 20;
    if (rerender !== false) {
      getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
        if (opcodeToSettings[block.type]) {
          const inputBlock = block.inputList[0].fieldRow[0];
          inputBlock.setVisible(false);
          inputBlock.setVisible(true);
          block.render();
        }
      });
    }
  },
  texthide: function (num, workspace, blockly, rerender) {
    if (blockly.BlockSvg.MAX_DISPLAY_LENGTH === (num > 0 ? num : Infinity)) return;
    blockly.BlockSvg.MAX_DISPLAY_LENGTH = num > 0 ? num : Infinity;
    if (rerender !== false) {
      getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
        if (opcodeToSettings[block.type]) {
          const inputBlock = block.inputList[0].fieldRow[0];
          inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LENGTH;
          inputBlock.setVisible(false);
          inputBlock.setVisible(true);
          block.render();
        }
      });
    }
  },
  texthides: function (num, workspace, blockly, rerender) {
    if (blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH === (num > 0 ? num : Infinity)) return;
    blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH = num > 0 ? num : Infinity;
    if (rerender !== false) {
      getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
        if (opcodeToSettings[block.type]) {
          const inputBlock = block.inputList[0].fieldRow[0];
          inputBlock.maxDisplayLength = blockly.BlockSvg.MAX_DISPLAY_LINE_LENGTH;
          inputBlock.setVisible(false);
          inputBlock.setVisible(true);
          block.render();
        }
      });
    }
  },
  textarea: function (Blockly) {
    const originShowEditorFunc = this.originShowEditor_;
    ScratchBlocks.FieldTextInput.prototype.showEditor_ = function (e) {
      const originalCreateElement = document.createElement;
      document.createElement = function (tagName) {
        document.createElement = originalCreateElement;
        if (
          tagName === "INPUT" &&
          document.getElementsByClassName("gandi_custom-procedures_workspace_1d2uW").length == 0
        ) {
          let s = originalCreateElement.call(document, "div");
          s.ClassName = "blocklyHtmlInputs";
          return originalCreateElement.call(document, textarea);
        } else {
          return originalCreateElement.call(document, tagName);
        }
      };
      originShowEditorFunc.call(this, e);
      document.createElement = originalCreateElement;

      const event = new Event("startInputing");
      document.body.dispatchEvent(event);
    };

    const originalResizeEditor = this.originalResizeEditor_;
    ScratchBlocks.FieldTextInput.prototype.resizeEditor_ = function () {
      if (!ResizeEditorAble) {
        originalResizeEditor.call(this);
        if (textarea == "textarea") {
          var scale = this.sourceBlock_.workspace.scale;
          var div = ScratchBlocks.WidgetDiv.DIV;

          var initialWidth;
          if (this.sourceBlock_.isShadow()) {
            initialWidth = this.sourceBlock_.getHeightWidth().width * scale;
          } else {
            initialWidth = this.size_.width * scale;
          }

          var width;
          if (ScratchBlocks.BlockSvg.FIELD_TEXTINPUT_EXPAND_PAST_TRUNCATION) {
            // Resize the box based on the measured width of the text, pre-truncation
            var textWidth = ScratchBlocks.scratchBlocksUtils.measureText(
              ScratchBlocks.FieldTextInput.htmlInput_.style.fontSize,
              ScratchBlocks.FieldTextInput.htmlInput_.style.fontFamily,
              ScratchBlocks.FieldTextInput.htmlInput_.style.fontWeight,
              ScratchBlocks.FieldTextInput.htmlInput_.value,
            );
            // Size drawn in the canvas needs padding and scaling
            textWidth += ScratchBlocks.FieldTextInput.TEXT_MEASURE_PADDING_MAGIC;
            textWidth *= scale;
            width = textWidth;
          } else {
            // Set width to (truncated) block size.
            width = initialWidth;
          }
          // The width must be at least FIELD_WIDTH and at most FIELD_WIDTH_MAX_EDIT
          width = Math.max(width, ScratchBlocks.BlockSvg.FIELD_WIDTH_MIN_EDIT * scale);
          width = Math.min(width, ScratchBlocks.BlockSvg.FIELD_WIDTH_MAX_EDIT * scale);
          // Add 1px to width and height to account for border (pre-scale)
          div.style.width = width / scale + 1 + "px";
          div.style.height = this.size_.height + "px";
          div.style.transform = "scale(" + scale + ")";

          // Use margin-left to animate repositioning of the box (value is unscaled).
          // This is the difference between the default position and the positioning
          // after growing the box.
          div.style.marginLeft = -0.5 * (width - initialWidth) + "px";

          // Add 0.5px to account for slight difference between SVG and CSS border
          var borderRadius = this.getBorderRadius() + 0.5;
          div.style.borderRadius = borderRadius + "px";
          ScratchBlocks.FieldTextInput.htmlInput_.style.borderRadius = borderRadius + "px";
          // Pull stroke colour from the existing shadow block
          var strokeColour = this.sourceBlock_.getColourTertiary();
          div.style.borderColor = strokeColour;

          var xy = this.getAbsoluteXY_();
          // Account for border width, post-scale
          xy.x -= scale / 2;
          xy.y -= scale / 2;
          // In RTL mode block fields and LTR input fields the left edge moves,
          // whereas the right edge is fixed.  Reposition the editor.
          if (this.sourceBlock_.RTL) {
            xy.x += width;
            xy.x -= div.offsetWidth * scale;
            xy.x += 1 * scale;
          }
          // Shift by a few pixels to line up exactly.
          xy.y += 1 * scale;
          if (navigator.userAgent.includes("Firefox")) {
            xy.x += 2 * scale;
            xy.y += 1 * scale;
          }
          if (navigator.userAgent.includes("WebKit")) {
            xy.y -= 1 * scale;
          }
          // Finally, set the actual style
          div.style.left = xy.x + "px";
          div.style.top = xy.y + "px";
        }
      }
    };

    const originHtmlInputKeyDown_ = this.originHtmlInputKeyDown_;
    ScratchBlocks.FieldTextInput.prototype.onHtmlInputKeyDown_ = function (e) {
      if (e.keyCode == 13) {
        let es = {};
        es.keyCode = null;
        originHtmlInputKeyDown_.call(this, es);
      } else {
        originHtmlInputKeyDown_.call(this, e);
      }
      const event = new Event("startInputing");
      document.body.dispatchEvent(event);
    };

    function splitStringIntoLines(inputString, charactersPerLine) {
      const regex = new RegExp(".{1," + charactersPerLine + "}", "g");
      let inputStringSplit = [];
      inputString.split("\n").forEach((line) => {
        if (line.match(regex)) inputStringSplit.push(...line.match(regex));
        else inputStringSplit.push("\u00A0");
      });
      if (inputStringSplit.length > ScratchBlocks.BlockSvg.MAX_DISPLAY_LINE_LENGTH) {
        inputStringSplit = inputStringSplit.slice(0, ScratchBlocks.BlockSvg.MAX_DISPLAY_LINE_LENGTH);
        let s = inputStringSplit[ScratchBlocks.BlockSvg.MAX_DISPLAY_LINE_LENGTH - 1];
        inputStringSplit[ScratchBlocks.BlockSvg.MAX_DISPLAY_LINE_LENGTH - 1] = s.slice(0, charactersPerLine - 3) + "…";
      }
      return inputStringSplit;
    }

    const originalRender_ = this.originalRender_;
    ScratchBlocks.FieldTextInput.prototype.render_ = function () {
      this.textElement_?.setAttribute("text-anchor", inputLabelTextAnchor);
      originalRender_.call(this);
      if (textarea == "textarea") {
        if (this.visible_ && this.textElement_) {
          while (this.textElement_.firstChild) {
            this.textElement_.removeChild(this.textElement_.firstChild);
          }
          let test = this.getDisplayText_();
          if (lineRender) {
            if (this.getText()) {
              if (this.getText().length > ScratchBlocks.BlockSvg.MAX_DISPLAY_LENGTH) {
                test = this.getText().slice(0, ScratchBlocks.BlockSvg.MAX_DISPLAY_LENGTH - 3) + "...";
              } else {
                test = this.getText();
              }
            }
          }
          const lines = splitStringIntoLines(test, renderWidth);
          let maxLengthLine = 0;
          let maxLength = 0;
          for (let index = 0; index < lines.length; index++) {
            const lineText = lines[index];
            let tspan = document.createElementNS(ScratchBlocks.SVG_NS, "tspan");
            if (lineText.length > maxLength) {
              maxLength = lineText.length;
              maxLengthLine = index;
            }
            tspan.textContent = lineText;
            if (index !== 0) {
              tspan.setAttribute("dy", 16);
            } else {
              tspan.setAttribute("x", 0);
            }
            this.textElement_.appendChild(tspan);
          }
          const fc = this.textElement_.children[maxLengthLine];

          this.size_.height = 16 * (lines.length + 1);
          this.size_.width = fc.getComputedTextLength();

          this.arrowWidth_ = 0;
          if (this.positionArrow) {
            this.arrowWidth_ = this.positionArrow(this.size_.width);
            this.size_.width += this.arrowWidth_;
          }
          // Update text centering, based on newly calculated width.
          var centerTextX = (this.size_.width - this.arrowWidth_) / 2;
          if (this.sourceBlock_.RTL) {
            centerTextX += this.arrowWidth_;
          }
          // In a text-editing shadow block's field,
          // if half the text length is not at least center of
          // visible field (FIELD_WIDTH), center it there instead,
          // unless there is a drop-down arrow.
          if (this.sourceBlock_.isShadow() && !this.positionArrow) {
            var minOffset = ScratchBlocks.BlockSvg.FIELD_WIDTH / 2;
            if (this.sourceBlock_.RTL) {
              // X position starts at the left edge of the block, in both RTL and LTR.
              // First offset by the width of the block to move to the right edge,
              // and then subtract to move to the same position as LTR.
              var minCenter = this.size_.width - minOffset;
              centerTextX = Math.min(minCenter, centerTextX);
            } else {
              // (width / 2) should exceed ScratchBlocks.BlockSvg.FIELD_WIDTH / 2
              // if the text is longer.
              centerTextX = Math.max(minOffset, centerTextX);
            }
          }

          // Apply new text element x position.
          this.textElement_.setAttribute("x", centerTextX);
          centerTextX = inputLabelTextAnchor === "middle" ? centerTextX : 0;
          for (const iterator of this.textElement_.children) {
            iterator.setAttribute("x", centerTextX);
          }
        }

        // Update any drawn box to the correct width and height.
        if (this.box_) {
          this.box_.setAttribute("width", this.size_.width);
          this.box_.setAttribute("height", this.size_.height);
        }
      }
    };
  },
  turnRender: function (bool) {
    ResizeEditorAble = bool;
  },
  dispose: function (workspace, Blockly) {
    ScratchBlocks.FieldTextInput.prototype.showEditor_ = this.originShowEditor_;
    ScratchBlocks.FieldTextInput.prototype.onHtmlInputKeyDown_ = this.originHtmlInputKeyDown_;
    ScratchBlocks.FieldTextInput.prototype.render_ = this.originalRender_;
    ScratchBlocks.FieldTextInput.prototype.resizeEditor_ = this.originalResizeEditor_;
    ScratchBlocks.BlockSvg.MAX_DISPLAY_LENGTH = Infinity;

    let needRerenderBlockTypes = new Set(["text", "number", "color"]);
    needRerenderBlockTypes.forEach((needRerenderBlockType) => {
      borderRestoration[needRerenderBlockType] = false;
    });

    getToolboxAndWorkspaceBlocks(workspace).forEach((block) => {
      const key = opcodeToSettings[block.type];
      if (key) {
        if (needRerenderBlockTypes.has(key)) {
          block.setOutputShape(ScratchBlocks.OUTPUT_SHAPE_ROUND);
        }
        const inputBlock = block.inputList[0].fieldRow[0];
        inputBlock.maxDisplayLength = ScratchBlocks.BlockSvg.MAX_DISPLAY_LENGTH;
        inputBlock.textElement_?.setAttribute("text-anchor", "middle");
        inputBlock.size_.height = ScratchBlocks.BlockSvg.FIELD_HEIGHT;
        inputBlock.setVisible(false);
        inputBlock.setVisible(true);
        block.render();
      }
    });
  },
};
export default lineText;
