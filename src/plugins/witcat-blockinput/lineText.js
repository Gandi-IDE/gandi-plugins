let styleElement = document.createElement("style");
styleElement.innerHTML = `
.blocklyHtmlInput{
  text-align: center;
}
`;
document.head.appendChild(styleElement);
let textarea = "textarea",
  renderWidth = 20,
  ResizeEditorAble = false;

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
  originShowEditorFunc: null,
  originHtmlInputKeyDown_: null,
  originalRender_: null,
  originalResizeEditor__: null,
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
    const originalJsonInit = Blockly.BlockSvg.prototype.jsonInit;

    Blockly.BlockSvg.prototype.jsonInit = function (json) {
      if (borderRestoration[opcodeToSettings[this.type]] === true) {
        originalJsonInit.call(this, {
          ...json,
          outputShape: Blockly.OUTPUT_SHAPE_SQUARE,
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
  dispose: function (Blockly) {
    Blockly.FieldTextInput.prototype.showEditor_ = this.originShowEditorFunc;
    Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_ = this.originHtmlInputKeyDown_;
    Blockly.FieldTextInput.prototype.render_ = this.originalRender_;
    Blockly.FieldTextInput.prototype.resizeEditor_ = this.originalResizeEditor__;
  },
  textarea: function (Blockly) {
    const originShowEditorFunc = Blockly.FieldTextInput.prototype.showEditor_;
    Blockly.FieldTextInput.prototype.showEditor_ = function (e) {
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

    const originalResizeEditor__ = Blockly.FieldTextInput.prototype.resizeEditor_;
    Blockly.FieldTextInput.prototype.resizeEditor_ = function () {
      if (!ResizeEditorAble) {
        originalResizeEditor__.call(this);
        if (textarea == "textarea") {
          var scale = this.sourceBlock_.workspace.scale;
          var div = Blockly.WidgetDiv.DIV;

          var initialWidth;
          if (this.sourceBlock_.isShadow()) {
            initialWidth = this.sourceBlock_.getHeightWidth().width * scale;
          } else {
            initialWidth = this.size_.width * scale;
          }

          var width;
          if (Blockly.BlockSvg.FIELD_TEXTINPUT_EXPAND_PAST_TRUNCATION) {
            // Resize the box based on the measured width of the text, pre-truncation
            var textWidth = Blockly.scratchBlocksUtils.measureText(
              Blockly.FieldTextInput.htmlInput_.style.fontSize,
              Blockly.FieldTextInput.htmlInput_.style.fontFamily,
              Blockly.FieldTextInput.htmlInput_.style.fontWeight,
              Blockly.FieldTextInput.htmlInput_.value,
            );
            // Size drawn in the canvas needs padding and scaling
            textWidth += Blockly.FieldTextInput.TEXT_MEASURE_PADDING_MAGIC;
            textWidth *= scale;
            width = textWidth;
          } else {
            // Set width to (truncated) block size.
            width = initialWidth;
          }
          // The width must be at least FIELD_WIDTH and at most FIELD_WIDTH_MAX_EDIT
          width = Math.max(width, Blockly.BlockSvg.FIELD_WIDTH_MIN_EDIT * scale);
          width = Math.min(width, Blockly.BlockSvg.FIELD_WIDTH_MAX_EDIT * scale);
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
          Blockly.FieldTextInput.htmlInput_.style.borderRadius = borderRadius + "px";
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

    const originHtmlInputKeyDown_ = Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_;
    Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_ = function (e) {
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
      return inputString.match(regex);
    }

    const originalRender_ = Blockly.FieldTextInput.prototype.render_;
    Blockly.FieldTextInput.prototype.render_ = function () {
      originalRender_.call(this);
      if (textarea == "textarea") {
        if (this.visible_ && this.textElement_) {
          // Replace the text.
          // this.textElement_.textContent = this.getDisplayText_();

          while (this.textElement_.firstChild) {
            this.textElement_.removeChild(this.textElement_.firstChild);
          }
          const texts = splitStringIntoLines(this.getDisplayText_(), renderWidth);
          for (const text of texts) {
            let tspan = document.createElementNS(Blockly.SVG_NS, "tspan");
            tspan.textContent = text;
            tspan.setAttribute("dy", 16);
            tspan.setAttribute("x", 0);
            this.textElement_.appendChild(tspan);
          }
          const fc = this.textElement_.firstChild;
          fc.removeAttribute("dy");

          this.size_.height = 16 * (texts.length + 1);
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
            var minOffset = Blockly.BlockSvg.FIELD_WIDTH / 2;
            if (this.sourceBlock_.RTL) {
              // X position starts at the left edge of the block, in both RTL and LTR.
              // First offset by the width of the block to move to the right edge,
              // and then subtract to move to the same position as LTR.
              var minCenter = this.size_.width - minOffset;
              centerTextX = Math.min(minCenter, centerTextX);
            } else {
              // (width / 2) should exceed Blockly.BlockSvg.FIELD_WIDTH / 2
              // if the text is longer.
              centerTextX = Math.max(minOffset, centerTextX);
            }
          }

          // Apply new text element x position.
          this.textElement_.setAttribute("x", centerTextX);
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
};
export default lineText;
