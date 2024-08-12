import toast from "react-hot-toast";
import blocksMedia from "./block-media";
import computedStyleToInlineStyle from "computed-style-to-inline-style";
import materialDrag from "./material-drag";
/* eslint-disable no-case-declarations */
let isHack = false;

const hack = {
  isHTTP: false,
  bluePrint: [],
  article: [],
  demo: [],
  CurrentIndex: 0,
  loading: null,
  MouseMoveEvent: {},
  msg: (e) => {
    return e;
  },
  setLoad: (callback) => {
    hack.loading = callback;
  },
  droping: false,
  DragInterval: null,
  dropContent: null,
  dropBlock: (e, workspace, utils, vm, drop = true) => {
    const matchSVGblockData = (text) => {
      const regex = /<svg[^>]*blockdata="([^"]*)"[^>]*>/g;
      const matches = [];
      let match;

      while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]);
      }

      return matches;
    };
    const fetchSvgFile = async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const svgText = await response.text();
        return svgText;
      } catch (error) {
        console.error("Fetch SVG file error:", error);
        toast.error(hack.msg("plugins.blockSharing.networkError"));
        return null;
      }
    };
    const s = workspace.getParentSvg();
    if (hack.droping) {
      if (drop) {
        hack.droping = false;
      }
      const decodeFromBase64Unicode = (base64Str) => {
        const binaryString = atob(base64Str);
        const uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(uint8Array);
      };
      if (typeof hack.dropContent === "string") {
        if (s.contains(e.target)) {
          fetchSvgFile(hack.dropContent).then(async (svgContent) => {
            if (svgContent) {
              const blockContent = matchSVGblockData(svgContent);

              if (blockContent.length > 0) {
                let XML = decodeFromBase64Unicode(blockContent[0]);
                hack.dropContent = null;
                const svgElement = workspace.getCanvas();
                const { left, top } = workspace.getParentSvg().getBoundingClientRect();
                const x = e.pageX - left + window.pageXOffset;
                const y = e.pageY - top + window.pageYOffset;
                const canvasXY = workspace.getScratchBlocks().utils.getRelativeXY(svgElement);
                const relativeX = (x - canvasXY.x) / workspace.scale;
                const relativeY = (y - canvasXY.y) / workspace.scale;
                const blocksState = JSON.parse(XML);
                const frameX = blocksState[0].x;
                const frameY = blocksState[0].y;
                blocksState[0].x = relativeX;
                blocksState[0].y = relativeY;
                try {
                  await vm.shareBlocksToTarget(blocksState, vm.editingTarget.originalTargetId);
                  vm.refreshWorkspace();
                } catch (e) {
                  try {
                    blocksState.forEach(async (e) => {
                      let block = e;
                      block.blocks.forEach((ev) => {
                        block.blockElements[ev].x = relativeX + (e.blockElements[ev].x - frameX);
                        block.blockElements[ev].y = relativeY + (e.blockElements[ev].y - frameY);
                      });
                      await vm.shareFrameToTarget(block, vm.editingTarget.originalTargetId);
                      vm.refreshWorkspace();
                    });
                  } catch (e) {
                    console.error(e);
                    toast.error(hack.msg("plugins.blockSharing.blockContentError"));
                  }
                }
              }
            }
          });
        }
      } else {
        const x = e.pageX + window.pageXOffset;
        const y = e.pageY + window.pageYOffset;
        hack.DragInterval.currentOffset = { x: x, y: y };
        utils.onDragAssetInfo(materialDrag(hack.DragInterval));
        clearInterval(hack.DragInterval);
        setTimeout(() => {
          utils.onDragAssetInfo(
            materialDrag({
              img: null,
              currentOffset: null,
              dragging: false,
              dragType: null,
              index: null,
              payload: null,
              source: undefined,
            }),
          );
          if (drop) hack.DragInterval = null;
        }, 10);
      }
    }
  },
  /**
   * 将积木/代码框转换为包含内容信息的svg图片
   * @param {unknown} element
   * @param {VirtualMachine} vm
   * @param {JSON} blockly
   * @returns {Promise}
   */
  exportSVG: (element, vm, blockly) => {
    const encodeToBase64Unicode = (str) => {
      const uint8Array = new TextEncoder().encode(str);
      let binaryString = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binaryString);
    };

    let target = null;
    if (element.blockDB_) {
      target = encodeToBase64Unicode(JSON.stringify(vm.xmlAdapter(blockly.Xml.frameToDom(element, true))));
    } else {
      target = encodeToBase64Unicode(JSON.stringify(vm.xmlAdapter(blockly.Xml.blockToDom(element, true))));
    }
    return hack.blockToSVG(element.id, blockly, target);
  },

  blockToSVG: (blockId, blockly, content) => {
    let target = null,
      frame = false;
    // Not sure any better way to access the scratch-blocks workspace than this...
    target = blockly.getMainWorkspace().getBlockById(blockId);
    if (!target) {
      frame = true;
      target = blockly.getMainWorkspace().getFrameById(blockId);
    }
    let targetSvg = target.getSvgRoot().cloneNode(true /* deep */);

    // Once we have the cloned SVG, do the rest in a setTimeout to prevent
    // blocking the drag end from finishing promptly.
    return new Promise((resolve) => {
      setTimeout(() => {
        // Strip &nbsp; entities that cannot be inlined
        targetSvg.innerHTML = targetSvg.innerHTML.replace(/&nbsp;/g, " ");
        let children = targetSvg.children;
        if (frame) {
          for (let i = 0; i <= children.length; i++) {
            if (children[i].classList.contains("blocklyFrameBlockCanvas")) {
              targetSvg = children[i];
              break;
            }
          }
        }

        // Create an <svg> element to put the cloned targetSvg inside
        const NS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(NS, "svg");
        svg.appendChild(targetSvg);

        // Needs to be on the DOM to get CSS properties and correct sizing
        document.body.appendChild(svg);

        const padding = 10;
        const extraHatPadding = 16;
        const topPadding = padding + (targetSvg.getAttribute("data-shapes") === "hat" ? extraHatPadding : 0);
        const leftPadding = padding;
        targetSvg.setAttribute("transform", `translate(${leftPadding} ${topPadding})`);

        const bounds = targetSvg.getBoundingClientRect();
        svg.setAttribute("blockdata", content);
        svg.setAttribute("width", bounds.width + 2 * padding);
        svg.setAttribute("height", bounds.height + 2 * padding);

        // We need to inline the styles set by CSS rules because
        // not all the styles are set directly on the SVG. This makes the
        // image styled the same way the block actually appears.
        // TODO this doesn't handle images that are xlink:href in the SVG
        computedStyleToInlineStyle(svg, {
          recursive: true,
          // Enumerate the specific properties we need to inline.
          // Specifically properties that are set from CSS in scratch-blocks
          properties: ["fill", "font-family", "font-size", "font-weight"],
        });

        let svgString = new XMLSerializer().serializeToString(svg);
        // resolve image path
        blocksMedia.forEach((value, key) => {
          svgString = svgString.replace(key, `"${value}"`);
        });

        // Once we have the svg as a string, remove it from the DOM
        svg.parentNode.removeChild(svg);
        /**
         * 将 SVG 文本转换为 Base64 编码的 Data URL
         * @param {string} svgText - 要转换的 SVG 文本
         * @return {string} - Base64 编码的 Data URL
         */

        // 创建一个 Blob 对象并使用 FileReader 将其转换为 Base64
        const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1];
          const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
          resolve(dataUrl);
        };
        reader.onerror = () => {
          resolve(undefined);
        };
        reader.readAsDataURL(svgBlob);
      }, 10);
    });
  },
  postBlocks: (blocks, workspace, utils, vm) => {
    hack.droping = true;
    hack.dropContent = blocks;
    const timer = setInterval(() => {
      if (vm?.editingTarget?.originalTargetId) {
        clearInterval(timer);
        hack.dropBlock(
          {
            target: workspace.getParentSvg(),
            pageX: document.documentElement.clientWidth / 2,
            pageY: document.documentElement.clientHeight / 2,
          },
          workspace,
          utils,
          vm,
        );
      }
    }, 100);
  },

  startHack: (workspace, blockly, vm, utils, isLoad) => {
    if (isHack === false) {
      isHack = true;
      const s = workspace.getParentSvg();

      let dropEvent = null;
      const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dt = e.dataTransfer;
        if (dt) {
          dropEvent = e;
          const files = dt.files;
          handleFiles(files);
        }
      };

      const handleFiles = (files) => {
        const svgFiles = [...files].filter((file) => file.type === "image/svg+xml");
        svgFiles.forEach(readFile);
      };

      const readFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result;
          processSVG(text);
        };
        reader.readAsText(file);
      };

      const processSVG = (svgContent) => {
        dropBlocks(svgContent, dropEvent);
      };

      const matchSVGblockData = (text) => {
        const regex = /<svg[^>]*blockdata="([^"]*)"[^>]*>/g;
        const matches = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
          matches.push(match[1]);
        }

        return matches;
      };

      const dropBlocks = async (svgContent, mouseEvent) => {
        const dropEvent = mouseEvent;
        const s = workspace.getParentSvg();
        if (s.contains(dropEvent.target)) {
          const decodeFromBase64Unicode = (base64Str) => {
            const binaryString = atob(base64Str);
            const uint8Array = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              uint8Array[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder().decode(uint8Array);
          };
          if (svgContent) {
            const blockContent = matchSVGblockData(svgContent);

            if (blockContent.length > 0) {
              const XML = decodeFromBase64Unicode(blockContent[0]);
              const svgElement = workspace.getCanvas();
              const { left, top } = workspace.getParentSvg().getBoundingClientRect();
              const x = dropEvent.pageX - left + window.pageXOffset;
              const y = dropEvent.pageY - top + window.pageYOffset;
              const canvasXY = workspace.getScratchBlocks().utils.getRelativeXY(svgElement);
              const relativeX = (x - canvasXY.x) / workspace.scale;
              const relativeY = (y - canvasXY.y) / workspace.scale;
              const blocksState = JSON.parse(XML);
              const frameX = blocksState[0].x;
              const frameY = blocksState[0].y;
              blocksState[0].x = relativeX;
              blocksState[0].y = relativeY;
              try {
                await vm.shareBlocksToTarget(blocksState, vm.editingTarget.originalTargetId);
                vm.refreshWorkspace();
              } catch (e) {
                try {
                  blocksState.forEach(async (e) => {
                    let block = e;
                    block.blocks.forEach((ev) => {
                      block.blockElements[ev].x = relativeX + (e.blockElements[ev].x - frameX);
                      block.blockElements[ev].y = relativeY + (e.blockElements[ev].y - frameY);
                    });
                    await vm.shareFrameToTarget(block, vm.editingTarget.originalTargetId);
                    vm.refreshWorkspace();
                  });
                } catch (e) {
                  toast.error(hack.msg("plugins.blockSharing.blockContentError"));
                }
              }
            }
          }
        }
      };

      const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      s.addEventListener("drop", handleDrop);
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        s.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
        window.addEventListener(eventName, preventDefaults, false);
      });
      const handlePaste = (event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text");

        // 处理被复制的内容
        if (text.startsWith("data:image/svg+xml;")) {
          const convertDataUrlToBlob = (dataUrl) => {
            // Split the data URL
            const parts = dataUrl.split(",");
            const byteString = atob(parts[1]);
            const mimeString = parts[0].split(":")[1].split(";")[0];

            // Convert to byte array
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
              byteArray[i] = byteString.charCodeAt(i);
            }

            // Create Blob
            const blob = new Blob([byteArray], { type: mimeString });
            return blob;
          };
          const file = new File([convertDataUrlToBlob(text)], "block.svg", {
            type: "image/svg+xml;charset=utf-8",
            lastModified: Date.now(),
          });
          const matchSVGBlockData = (text) => {
            const regex = /<svg[^>]*blockdata="([^"]*)"[^>]*>/g;
            let matches = [];
            let match;

            while ((match = regex.exec(text)) !== null) {
              matches.push(match[1]);
            }

            return matches;
          };
          const handleSetFileType = (file) => {
            const reader = new FileReader();

            reader.onload = function (event) {
              const result = event.target?.result;
              let content = matchSVGBlockData(String(result));
              if (content.length > 0) {
                dropBlocks(result, hack.MouseMoveEvent);
              }
            };
            reader.readAsText(file);
          };
          handleSetFileType(file);
        }
      };
      document.addEventListener("paste", handlePaste);

      window.addEventListener("mousemove", (e) => {
        hack.MouseMoveEvent = e;
      });

      const pagePos = (x, y) => {
        let pageX, pageY;
        if (hack.CurrentIndex === 0) {
          //本地环境下拿到的event不一样
          if (hack.isHTTP) {
            const pos = document.getElementById("gandi-solution-article-iframe").getBoundingClientRect();
            pageX = x + pos.left;
            pageY = y + pos.top;
          } else {
            pageX = x + window.scrollX;
            pageY = y + window.scrollY;
          }
        } else {
          pageX = x;
          pageY = y;
        }
        return { x: pageX, y: pageY };
      };
      const message = (e) => {
        if (e.data.length === 2) {
          console.log("收到消息：", e.data);
        }
        switch (e.data[0]) {
          case "isload":
            isLoad(e.data[1]);
            break;
          case "dragging":
            const pos = pagePos(e.data[1][0], e.data[1][1]);
            hack.dropBlock(
              {
                target: null,
                pageX: pos.x,
                pageY: pos.y,
              },
              workspace,
              utils,
              vm,
              false,
            );
            break;
          case "postBlock":
            hack.droping = true;
            hack.dropContent = e.data[1];
            hack.dropBlock(
              {
                target: workspace.getParentSvg(),
                pageX: document.documentElement.clientWidth / 2,
                pageY: document.documentElement.clientHeight / 2,
              },
              workspace,
              utils,
              vm,
            );
            break;
          case "cancelDrop":
            const position = pagePos(e.data[1][0], e.data[1][1]);
            const target = document.elementFromPoint(position.x, position.y);

            hack.dropBlock(
              {
                target: target,
                pageX: position.x,
                pageY: position.y,
              },
              workspace,
              utils,
              vm,
            );
            break;
          case "startDrop":
            hack.droping = true;
            hack.dropContent = e.data[1];
            document.addEventListener(
              "mousedown",
              () => {
                if (hack.droping) {
                  hack.droping = false;
                  hack.dropContent = null;
                }
              },
              { once: true, capture: true },
            );
            if (typeof hack.dropContent !== "string") {
              const DRAG_TYPE = {
                SOUND: "BACKPACK_SOUND",
                COSTUME: "BACKPACK_COSTUME",
                SPRITE: "BACKPACK_SPRITE",
                SCRIPT: "BACKPACK_CODE",
              };
              if (Object.prototype.hasOwnProperty.call(DRAG_TYPE, hack.dropContent.type)) {
                let s = hack.dropContent;
                s.md5 = s.uri;
                const blockContent = {
                  currentOffset: { x: -50, y: -50 },
                  dragType: DRAG_TYPE[s.type],
                  dragging: true,
                  img: s.previewImages[0],
                  payload: s,
                };
                delete blockContent.payload.student;
                delete blockContent.payload.themePack;
                delete blockContent.payload.containsTypes;
                delete blockContent.payload.stats;
                delete blockContent.payload.status;
                delete blockContent.payload.highResolutionImages;
                blockContent.payload.customizedInfo = null;
                blockContent.source = "cloud";
                hack.DragInterval = blockContent;
                utils.onDragAssetInfo(materialDrag(blockContent));
              } else {
                hack.droping = false;
                hack.dropContent = null;
              }
            }
            break;
          case "article":
            if (!hack.article.some((item) => item.url === e.data[1].url)) {
              hack.article.push(e.data[1]);
              console.log("新文章被加载：\n", e.data[1]);
            }
            break;
          case "bluePrint":
            if (!hack.bluePrint.some((item) => item.url === e.data[1].url)) {
              switch (e.data[1].block) {
                case "block":
                  hack.bluePrint.push(e.data[1]);
                  console.log("新蓝图被加载：\n", e.data[1]);
                  break;
                case "assets":
                  hack.bluePrint.push(e.data[1]);
                  console.log("新素材被加载：\n", e.data[1]);
                  break;
              }
            }
            break;
          case "demo":
            if (!hack.demo.some((item) => item.url === e.data[1].url)) {
              if (e.data[1].block) {
                hack.demo.push(e.data[1]);
                console.log("新项目被加载：\n", e.data[1]);
              }
            }
            break;
          case "dispose":
            uninstall();
            break;
          default:
            break;
        }
      };
      window.addEventListener("message", message);
      const uninstall = () => {
        const s = workspace.getParentSvg();

        // 移除事件监听器
        const removeListener = (element, eventName, handler) => {
          element.removeEventListener(eventName, handler, false);
        };
        ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
          removeListener(s, eventName, preventDefaults);
          removeListener(document.body, eventName, preventDefaults);
          removeListener(window, eventName, preventDefaults);
        });

        // 移除鼠标移动事件监听器
        window.removeEventListener("mousemove", hack.MouseMoveEvent);

        // 移除其他可能的事件监听器
        removeListener(s, "drop", handleDrop);
        document.removeEventListener("paste", handlePaste);

        // 移除与消息相关的监听器
        window.removeEventListener("message", message);

        // 取消任何正在进行的拖拽操作
        hack.droping = false;
        hack.dropContent = null;
        hack.DragInterval = null;

        // 清空 hack 对象中的资源
        hack.bluePrint = [];
        hack.article = [];
        hack.demo = [];
        hack.loading = null;

        isHack = false;
      };
    }
  },
};

export default hack;
