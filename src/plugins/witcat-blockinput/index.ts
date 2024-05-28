import lineText from "./lineText";
import React from "react";
import BlockinputaIcon from "assets/icon--witcat-blockinput.svg";

let show = false,
  inshow = false,
  textLeft = true,
  // eslint-disable-next-line prefer-const
  loaded = [];

let checkLong = 50,
  timer = null;

const WitcatBlockinput = ({ registerSettings, msg, vm, workspace, blockly }: PluginContext) => {
  lineText.init(blockly);
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
  if (loaded.indexOf("start") === -1) document.body.addEventListener("startInputing", listener);
  if (loaded.indexOf("textLeft") === -1) lineText.textLeft(false);
  if (loaded.indexOf("svg") === -1) lineText.svg(blockly);
  if (loaded.indexOf("svgStart-text") === -1) lineText.svgStart(true, workspace, blockly, "text");
  if (loaded.indexOf("changeRenderWidth") === -1) lineText.changeRenderWidth(20, workspace);
  if (loaded.indexOf("textarea") === -1) lineText.textarea(blockly);
  if (loaded.indexOf("changTextarea") === -1) lineText.changTextarea(true);
  if (loaded.indexOf("linerender") === -1) lineText.linerender(true, workspace, false);
  if (loaded.indexOf("texthide") === -1) lineText.texthide(20, workspace, blockly);
  if (loaded.indexOf("texthides") === -1) lineText.texthides(3, workspace, blockly);

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
            label: msg("witcat.blockinput.option.advancedInput"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              loaded.push("start");
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
            label: msg("witcat.blockinput.option.showOnExceed"),
            value: 50,
            onChange: (value: number) => {
              loaded.push("show");
              checkLong = value;
            },
          },
          {
            key: "linetext",
            label: msg("witcat.blockinput.option.multiLineText"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              loaded.push("changTextarea");
              lineText.changTextarea(value);
            },
          },
          {
            key: "border",
            label: msg("witcat.blockinput.option.roundedTextBorder"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              loaded.push("svgStart-text");
              lineText.svgStart(value, workspace, blockly, "text");
            },
          },
          {
            key: "numborder",
            label: msg("witcat.blockinput.option.roundedNumberBorder"),
            type: "switch",
            value: false,
            onChange: (value: boolean) => {
              loaded.push("svgStart-number");
              lineText.svgStart(value, workspace, blockly, "number");
            },
          },
          {
            key: "colorborder",
            label: msg("witcat.blockinput.option.roundedColorBorder"),
            type: "switch",
            value: false,
            onChange: (value: boolean) => {
              loaded.push("svgStart-color");
              lineText.svgStart(value, workspace, blockly, "color");
            },
          },
          {
            key: "textalign",
            label: msg("witcat.blockinput.option.leftAlignText"),
            type: "switch",
            value: false,
            onChange: (value: boolean) => {
              loaded.push("textLeft");
              lineText.textLeft(value);
            },
          },
          {
            key: "textaligns",
            label: msg("witcat.blockinput.option.leftAlignAdvancedText"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              textLeft = value;
            },
          },
          {
            key: "textalignss",
            label: msg("witcat.blockinput.option.leftAlignRenderedText"),
            type: "switch",
            value: false,
            onChange: (value: boolean) => {
              lineText.lineTextLeft(value, vm, workspace, blockly);
            },
          },
          {
            key: "linerender",
            label: msg("witcat.blockinput.option.renderMultiLineText"),
            type: "switch",
            value: true,
            onChange: (value: boolean) => {
              loaded.push("linerender");
              lineText.linerender(value, workspace);
            },
          },
          {
            key: "hide",
            type: "input",
            inputProps: {
              type: "number",
            },
            label: msg("witcat.blockinput.option.autoEllipsis"),
            value: 20,
            onChange: (value: number) => {
              loaded.push("texthide");
              debounce(() => {
                lineText.texthide(value, workspace, blockly);
              }, 1000);
            },
          },
          {
            key: "hideline",
            type: "input",
            inputProps: {
              type: "number",
            },
            label: msg("witcat.blockinput.option.autoEllipsisLine"),
            value: 3,
            onChange: (value: number) => {
              loaded.push("texthides");
              debounce(() => {
                lineText.texthides(value, workspace, blockly);
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
              loaded.push("changeRenderWidth");
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
      lineText.changTextarea(false);
      lineText.textLeft(false);
      lineText.dispose(workspace, blockly);
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
