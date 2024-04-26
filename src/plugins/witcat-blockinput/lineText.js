let styleElement = document.createElement("style");
styleElement.innerHTML = `
.blocklyHtmlInput{
    text-align: center;
}
`;
document.head.appendChild(styleElement);
let svgStart = true,
  textarea = "textarea";

const lineText = {
  svgstart: function (start, vm, workspace, blockly) {
    svgStart = start;
    this.updateAllBlocks(vm, workspace, blockly);
  },
  svg: function (Blockly) {
    const originalJsonInit = Blockly.BlockSvg.prototype.jsonInit;

    Blockly.BlockSvg.prototype.jsonInit = function (json) {
      if (this.type === "text" && svgStart) {
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
  changTextarea: function (start, vm, workspace, blockly) {
    textarea = start ? "textarea" : "input";
    this.updateAllBlocks(vm, workspace, blockly);
  },
  texthide: function (num, vm, workspace, blockly) {
    blockly.BlockSvg.MAX_DISPLAY_LENGTH = num > 0 ? num : Infinity;
    this.updateAllBlocks(vm, workspace, blockly);
  },
  textarea: function (Blockly) {
    const originShowEditorFunc = Blockly.FieldTextInput.prototype.showEditor_;
    Blockly.FieldTextInput.prototype.showEditor_ = function (e) {
      const originalCreateElement = document.createElement;
      document.createElement = function (tagName) {
        document.createElement = originalCreateElement;
        if (tagName === "INPUT") {
          return originalCreateElement.call(document, "TEXTAREA");
        } else {
          return originalCreateElement.call(document, tagName);
        }
      };
      originShowEditorFunc.call(this, e);
      document.createElement = originalCreateElement;

      const event = new Event("startInputing");
      document.body.dispatchEvent(event);
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
          const texts = splitStringIntoLines(this.getDisplayText_(), 20);
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
  updateAllBlocks: function (vm, workspace, blockly) {
    const eventsOriginallyEnabled = blockly.Events.isEnabled();
    blockly.Events.disable(); // Clears workspace right-click→undo (see SA/SA#6691)

    if (workspace) {
      if (vm.editingTarget) {
        vm.emitWorkspaceUpdate();
      }
      const flyout = workspace.getFlyout();
      if (flyout) {
        const flyoutWorkspace = flyout.getWorkspace();
        window.Blockly.Xml.clearWorkspaceAndLoadFromXml(
          window.Blockly.Xml.workspaceToDom(flyoutWorkspace),
          flyoutWorkspace,
        );
        workspace.getToolbox().refreshSelection();
        workspace.toolboxRefreshEnabled_ = true;
      }
    }

    // There's no particular reason for checking whether events were originally enabled.
    // Unconditionally enabling events at this point could, in theory, cause bugs in the future.
    if (eventsOriginallyEnabled) blockly.Events.enable(); // Re-enable events
  },
};
export default lineText;
