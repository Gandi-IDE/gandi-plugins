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
    Blockly.FieldTextInput.prototype.showEditor_ = function (
      opt_quietInput,
      opt_readOnly,
      opt_withArrow,
      opt_arrowCallback,
    ) {
      Blockly.BlockSvg.MAX_DISPLAY_LENGTH = Infinity;
      this.workspace_ = this.sourceBlock_.workspace;
      var quietInput = opt_quietInput || false;
      var readOnly = opt_readOnly || false;
      Blockly.WidgetDiv.show(
        this,
        this.sourceBlock_.RTL,
        this.widgetDispose_(),
        this.widgetDisposeAnimationFinished_(),
        Blockly.FieldTextInput.ANIMATION_TIME,
      );
      var div = Blockly.WidgetDiv.DIV;
      // Apply text-input-specific fixed CSS
      div.className += " fieldTextInput";
      // Create the input.
      var htmlInput = document.createElement(textarea);
      htmlInput.className = "blocklyHtmlInput";
      htmlInput.setAttribute("spellcheck", this.spellcheck_);
      if (readOnly) {
        htmlInput.setAttribute("readonly", "true");
      }
      if (htmlInput instanceof HTMLTextAreaElement) {
        htmlInput.style.resize = "none";
      }
      /** @type {!HTMLInputElement} */
      Blockly.FieldTextInput.htmlInput_ = htmlInput;
      div.appendChild(htmlInput);

      if (opt_withArrow) {
        // Move text in input to account for displayed drop-down arrow.
        if (this.sourceBlock_.RTL) {
          htmlInput.style.paddingLeft = this.arrowSize_ + Blockly.BlockSvg.DROPDOWN_ARROW_PADDING + "px";
        } else {
          htmlInput.style.paddingRight = this.arrowSize_ + Blockly.BlockSvg.DROPDOWN_ARROW_PADDING + "px";
        }
        // Create the arrow.
        var dropDownArrow = document.createElement("img");
        dropDownArrow.className = "blocklyTextDropDownArrow";
        dropDownArrow.setAttribute("src", Blockly.mainWorkspace.options.pathToMedia + "dropdown-arrow-dark.svg");
        dropDownArrow.style.width = this.arrowSize_ + "px";
        dropDownArrow.style.height = this.arrowSize_ + "px";
        dropDownArrow.style.top = this.arrowY_ + "px";
        dropDownArrow.style.cursor = "pointer";
        // Magic number for positioning the drop-down arrow on top of the text editor.
        var dropdownArrowMagic = "11px";
        if (this.sourceBlock_.RTL) {
          dropDownArrow.style.left = dropdownArrowMagic;
        } else {
          dropDownArrow.style.right = dropdownArrowMagic;
        }
        if (opt_arrowCallback) {
          htmlInput.dropDownArrowMouseWrapper_ = Blockly.bindEvent_(
            dropDownArrow,
            "mousedown",
            this,
            opt_arrowCallback,
          );
        }
        div.appendChild(dropDownArrow);
      }

      htmlInput.value = htmlInput.defaultValue = this.text_;
      htmlInput.oldValue_ = null;
      this.validate_();
      this.resizeEditor_();
      if (!quietInput) {
        htmlInput.focus();
        htmlInput.select();
        // For iOS only
        htmlInput.setSelectionRange(0, 99999);
      }

      this.bindEvents_(htmlInput, quietInput || readOnly);

      // Add animation transition properties
      var transitionProperties = "box-shadow " + Blockly.FieldTextInput.ANIMATION_TIME + "s";
      if (Blockly.BlockSvg.FIELD_TEXTINPUT_ANIMATE_POSITIONING) {
        div.style.transition +=
          ",padding " +
          Blockly.FieldTextInput.ANIMATION_TIME +
          "s," +
          "width " +
          Blockly.FieldTextInput.ANIMATION_TIME +
          "s," +
          "height " +
          Blockly.FieldTextInput.ANIMATION_TIME +
          "s," +
          "margin-left " +
          Blockly.FieldTextInput.ANIMATION_TIME +
          "s";
      }
      div.style.transition = transitionProperties;
      // The animated properties themselves
      htmlInput.style.fontSize = Blockly.BlockSvg.FIELD_TEXTINPUT_FONTSIZE_FINAL + "pt";
      div.style.boxShadow = "0px 0px 0px 4px " + Blockly.Colours.fieldShadow;
    };

    Blockly.FieldTextInput.prototype.resizeEditor_ = function () {
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
    };
    Blockly.FieldTextInput.prototype.onHtmlInputKeyDown_ = function (e) {
      var htmlInput = Blockly.FieldTextInput.htmlInput_;
      var tabKey = 9,
        enterKey = 13,
        escKey = 27;
      if (e.keyCode == enterKey && document.getElementsByClassName("blocklyHtmlInput")[0].tagName == "textarea") {
        Blockly.WidgetDiv.hide();
        Blockly.DropDownDiv.hideWithoutAnimation();
      } else if (e.keyCode == escKey) {
        htmlInput.value = htmlInput.defaultValue;
        Blockly.WidgetDiv.hide();
        Blockly.DropDownDiv.hideWithoutAnimation();
      } else if (e.keyCode == tabKey) {
        Blockly.WidgetDiv.hide();
        Blockly.DropDownDiv.hideWithoutAnimation();
        this.sourceBlock_.tab(this, !e.shiftKey);
        e.preventDefault();
      }
    };

    // Blockly.FieldTextInput.prototype.getDisplayText_ = function () {
    //     var text = this.text_;
    //     if (!text) {
    //         // Prevent the field from disappearing if empty.
    //         return Blockly.Field.NBSP;
    //     }
    //     if (text.length > this.maxDisplayLength) {
    //         // Truncate displayed string and add an ellipsis ('...').
    //         text = text.substring(0, this.maxDisplayLength - 2) + '\u2026';
    //     }
    //     // Replace whitespace with non-breaking spaces so the text doesn't collapse.
    //     text = text.replace(/\s/g, Blockly.Field.NBSP);

    //     if (this.sourceBlock_.RTL) {
    //         // The SVG is LTR, force text to be RTL unless a number.
    //         if (this.sourceBlock_.editable_ && this.sourceBlock_.type === 'math_number') {
    //             text = '\u202A' + text + '\u202C';
    //         } else {
    //             text = '\u202B' + text + '\u202C';
    //         }
    //     }
    //     return text;
    // };

    function splitStringIntoLines(inputString, charactersPerLine) {
      const regex = new RegExp(".{1," + charactersPerLine + "}", "g");
      return inputString.match(regex);
    }
    console.log(Blockly.FieldTextInput.prototype.render_);

    Blockly.FieldTextInput.prototype.render_ = function () {
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
      } else {
        if (this.visible_ && this.textElement_) {
          (this.textElement_.textContent = this.getDisplayText_()), this.updateWidth();
          var e = (this.size_.width - this.arrowWidth_) / 2;
          if ((this.sourceBlock_.RTL && (e += this.arrowWidth_), this.sourceBlock_.isShadow() && !this.positionArrow)) {
            var t = Blockly.BlockSvg.FIELD_WIDTH / 2;
            e = this.sourceBlock_.RTL ? Math.min(this.size_.width - t, e) : Math.max(t, e);
          }
          this.textElement_.setAttribute("x", e);
        }
        this.box_ &&
          (this.box_.setAttribute("width", this.size_.width), this.box_.setAttribute("height", this.size_.height));
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
