import lineText from "./lineText";
import React from "react";
import BlockinputaIcon from "assets/icon--witcat-blockinput.svg";

let show = false,
  inshow = false,
  textLeft = true;

let checkLong = 50,
  timer = null;

const WitcatBlockinput = ({ registerSettings, msg, workspace, blockly }: PluginContext) => {
  lineText.originShowEditorFunc = blockly.FieldTextInput.prototype.showEditor_;
  lineText.originHtmlInputKeyDown_ = blockly.FieldTextInput.prototype.onHtmlInputKeyDown_;
  lineText.originalRender_ = blockly.FieldTextInput.prototype.render_;
  lineText.originalResizeEditor__ = blockly.FieldTextInput.prototype.resizeEditor_;
  const listener = () => {
    const input = document.getElementsByClassName("blocklyHtmlInput")[0] as
      | HTMLInputElement
      | HTMLTextAreaElement
      | undefined;
    if (input !== undefined) {
      input.style.resize = "none";
      if (input.value.length > checkLong) {
        if (!show) {
          show = true;
          popups(input).then(() => {
            show = false;
          });
        }
      }
      if (!inshow) {
        setTimeout(() => {
          if (input.scrollHeight <= input.offsetHeight) {
            input.style.lineHeight = `${input.scrollHeight}px`;
            if (input.scrollHeight > input.offsetHeight) {
              input.style.lineHeight = "1.2";
            }
          } else {
            input.style.lineHeight = "1.2";
          }
        }, 10);
      } else {
        input.style.lineHeight = "1.2";
      }
    }
  };
  document.body.addEventListener("startInputing", listener);
  lineText.textLeft(false);
  lineText.svg(blockly);
  lineText.svgstart(true, workspace, blockly, "");
  lineText.changeRenderWidth(20, workspace);
  lineText.textarea(blockly);
  lineText.changTextarea(true);
  lineText.texthide(20, workspace, blockly);

  const popups = (input: HTMLInputElement | HTMLTextAreaElement): Promise<void> => {
    return new Promise((resolve) => {
      inshow = true;
      lineText.turnRender(true);
      const div = document.createElement("div");
      div.style.position = "fixed";
      div.style.top = "0px";
      div.style.left = "0px";
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.zIndex = "9999";
      div.style.transition = "all 0.2s ease-out";
      div.style.backgroundColor = "#00000000";

      div.innerHTML = `
        <div id="myModal" class="modal">
          <div class="modals">
            <span class="close">
              &times;
            </span>
            <h5 class="modal-title">${msg("witcat.blockinput.title")}</h5>
            <div class="modal-content">
            </div>
          </div>
        </div>
        <style>
          .modal{
            height:0%;
            transition:all 0.2s ease-out;
          }

          .modal-content {
            margin - top:16px;
          height:calc(100% - 16px);
          overflow: scroll;
          }

          .modals{
            background - color: #00000000;
            margin: 15vh 25vw;
            padding: 20px;
            border-radius:10px;
            width: 50%;
            height:70vh;
            position:relative;
            transition:all 0.3s ease-out;
          }

          .modal-content::-webkit-scrollbar-corner {
            background - color: transparent;
          }

          .modal-content p {
            color: var(--theme-text-primary);
          }

          .modals h5 {
            position:relative;
            bottom: 10px;
            color: #00000000;
            font-size: 20px;
            transition:all 0.3s ease-out;
          }

          .close {
            cursor: pointer;
            position:absolute;
            top:0;
            right:10px;
            font-size:28px;
            font-weight:bold;
            color: #00000000;
            transition:all 0.3s ease-out;
          }

          //关闭特效
          .close:hover,
          .close:focus {
            color: black;
            text-decoration: none;
          }

        </style>
        `;
      const inputstyle = () => {
        try {
          input.parentElement.style.opacity = "1.0";
          input.parentElement.style.position = "fixed";
          input.parentElement.style.top = "calc(15vh + 30px)";
          input.parentElement.style.left = "25vw";
          input.parentElement.style.width = "calc(50% - 20px)";
          input.parentElement.style.height = "calc(70vh - 60px)";
          input.parentElement.style.margin = "20px 10px";
          input.parentElement.style.border = "none";
          input.parentElement.style.background = "var(--theme-color-150)";
          input.parentElement.style.borderRadius = "10px";
          input.parentElement.style.transform = "";
          input.parentElement.style.padding = "10px";
          input.parentElement.style.boxShadow = "var(--theme-scrollbar-color) 0px 0px 0px 4px";
          input.style.background = "var(--theme-color-150)";
          input.style.border = "none";
          input.style.color = "var(--theme-text-primary)";
          input.style.borderRadius = "0px";
          input.style.textAlign = textLeft ? "left" : "center";
        } catch {
          input = document.getElementsByClassName("blocklyHtmlInput")[0] as HTMLInputElement;
          input.parentElement.style.transition = "none";
          input.parentElement.style.opacity = "0.0";
          input.parentElement.style.position = "fixed";
          input.parentElement.style.top = "15vh";
          input.parentElement.style.left = "25vw";
          input.parentElement.style.width = "50%";
          input.parentElement.style.height = "70vh";
          input.parentElement.style.margin = "20px 10px";
          input.parentElement.style.border = "none";
          input.parentElement.style.background = "var(--theme-color-150)";
          input.parentElement.style.borderRadius = "10px";
          input.parentElement.style.transform = "";
          input.parentElement.style.padding = "10px";
          input.parentElement.style.boxShadow = "var(--theme-scrollbar-color) 0px 0px 0px 4px";
          input.style.background = "var(--theme-color-150)";
          input.style.border = "none";
          input.style.color = "var(--theme-text-primary)";
          input.style.borderRadius = "0px";
          input.style.textAlign = textLeft ? "left" : "center";
          setTimeout(() => {
            input.parentElement.style.transition = "all 0.3s ease-out";
            inputstyle();
          }, 10);
        }
      };
      input.parentElement.style.transition = "all 0.3s ease-out";
      inputstyle();

      document.body.appendChild(div);

      const modal = document.getElementById("myModal") as HTMLDivElement;
      const span = document.querySelector(".close") as HTMLSpanElement;

      const config: MutationObserverInit = {
        attributes: true,
        childList: true,
        subtree: true,
      };

      const callback = function (mutationsList: MutationRecord[], observer: MutationObserver) {
        observer.disconnect();
        const input = document.getElementsByClassName("blocklyHtmlInput")[0] as HTMLInputElement | undefined;
        if (input !== undefined) {
          inputstyle();
          observer.observe(input.parentElement, config);
        } else {
          div.style.backgroundColor = "#00000000";
          modal.style.height = "0%";
          (document.getElementsByClassName("modals")[0] as HTMLDivElement).style.backgroundColor = "#00000000";
          span.style.color = "#00000000";
          (document.getElementsByClassName("modal-title")[0] as HTMLElement).style.color = "#00000000";
          setTimeout(() => {
            inshow = false;
            lineText.turnRender(false);
            div.remove();
            resolve();
          }, 300);
        }
      };

      const observer = new MutationObserver(callback);
      observer.observe(input.parentElement, config);

      setTimeout(() => {
        div.style.backgroundColor = "var(--theme-scrollbar-color)";
        modal.style.height = "80%";
        (document.getElementsByClassName("modals")[0] as HTMLDivElement).style.backgroundColor =
          "var(--theme-color-300)";
        span.style.color = "var(--theme-color-g300)";
        (document.getElementsByClassName("modal-title")[0] as HTMLElement).style.color = "var(--theme-text-primary)";
      }, 300);
    });
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
                document.body.addEventListener("startInputing", listener);
              } else {
                document.body.removeEventListener("startInputing", listener);
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
            value: 50,
            onChange: (value: number) => {
              checkLong = value;
            },
          },
          {
            key: "linetext",
            label: msg("witcat.blockinput.option.linetext"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              lineText.changTextarea(value);
            },
          },
          {
            key: "border",
            label: msg("witcat.blockinput.option.border"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              lineText.svgstart(value, workspace, blockly, "text");
            },
          },
          {
            key: "numborder",
            label: msg("witcat.blockinput.option.numborder"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              lineText.svgstart(value, workspace, blockly, "number");
            },
          },
          {
            key: "colorborder",
            label: msg("witcat.blockinput.option.colorborder"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              lineText.svgstart(value, workspace, blockly, "color");
            },
          },
          {
            key: "textalign",
            label: msg("witcat.blockinput.option.textalign"),
            type: "switch",
            value: false,
            onChange: (value: boolean) => {
              lineText.textLeft(value);
            },
          },
          {
            key: "textaligns",
            label: msg("witcat.blockinput.option.textaligns"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              textLeft = value;
            },
          },
          {
            key: "hide",
            type: "input",
            inputProps: {
              type: "number",
            },
            label: msg("witcat.blockinput.option.hide"),
            value: 20,
            onChange: (value: number) => {
              debounce(() => {
                lineText.texthide(value, workspace, blockly);
              }, 1000);
            },
          },
          {
            key: "renderWidth",
            type: "input",
            inputProps: {
              type: "number",
            },
            label: msg("witcat.blockinput.option.renderWidth"),
            value: 20,
            onChange: (value: number) => {
              debounce(() => {
                lineText.changeRenderWidth(value, workspace);
              }, 1000);
            },
          },
        ],
      },
    ],
    React.createElement(BlockinputaIcon),
  );
  return {
    dispose: () => {
      document.body.removeEventListener("startInputing", listener);
      lineText.svgstart(false, workspace, blockly, "");
      lineText.changTextarea(false);
      lineText.textLeft(false);
      lineText.texthide(0, workspace, blockly);
      lineText.dispose(blockly);
      register.dispose();
    },
  };
};

export default WitcatBlockinput;

function debounce(func: { (): void; (): void }, delay: number) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    func();
  }, delay);
}
