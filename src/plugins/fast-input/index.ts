import WorkspaceQuerier, { QueryResult } from "./WorkspaceQuerier.js";
import renderBlock, { getBlockHeight } from "./BlockRenderer.js";
import { BlockInstance, BlockTypeInfo } from "./BlockTypeInfo.js";
import { onClearTextWidthCache } from "./module.js";
import "./compatibility.css";
import "./styles.css";
import FastInputIcon from "assets/icon--fast-input.svg";
import React from "react";
import VirtualScroller, { ItemData, RenderItemFunc } from "./VirtualScroller";

interface MenuItem {
  block: BlockInstance;
  autocompleteFactory?: (endOnly: boolean) => string;
}

interface Position {
  x: number;
  y: number;
}

interface Elements {
  popupRoot: HTMLDivElement;
  popupContainer: HTMLDivElement;
  popupInput: HTMLInputElement;
  popupInputContainer: HTMLDivElement;
  popupInputSuggestion: HTMLInputElement;
  popupPreviewContainer: HTMLDivElement;
  popupPreviewBlocks: SVGSVGElement;
  popupPreviewScrollbarSVG: SVGSVGElement;
  popupPreviewScrollbarBackground: SVGRectElement;
}

interface CleanupFunction {
  (): void;
}

interface FastInputPlugin {
  dispose: () => void;
}

const PREVIEW_LIMIT = 50;

const FastInput = ({ blockly: Blockly, vm, msg, registerSettings }: PluginContext): FastInputPlugin => {
  const cleanupListeners: Set<CleanupFunction> = new Set();
  let mousePosition: Position = { x: 0, y: 0 };

  const createElement = (): Elements => {
    const popupRoot = document.createElement("div");
    document.body.appendChild(popupRoot);
    popupRoot.classList.add("sa-mcp-root");
    popupRoot.dir = "ltr";
    popupRoot.style.display = "none";

    const popupContainer = document.createElement("div");
    popupRoot.appendChild(popupContainer);
    popupContainer.classList.add("sa-mcp-container");

    const popupInputContainer = document.createElement("div");
    popupContainer.appendChild(popupInputContainer);
    popupInputContainer.classList.add("sa-mcp-input-wrapper");

    const popupInputSuggestion = document.createElement("input");
    popupInputContainer.appendChild(popupInputSuggestion);
    popupInputSuggestion.classList.add("sa-mcp-input-suggestion");

    const popupInput = document.createElement("input");
    popupInputContainer.appendChild(popupInput);
    popupInput.classList.add("sa-mcp-input");
    popupInput.setAttribute("autocomplete", "off");

    const popupPreviewContainer = document.createElement("div");
    popupContainer.appendChild(popupPreviewContainer);
    popupPreviewContainer.classList.add("sa-mcp-preview-container");

    const popupPreviewScrollbarSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    popupContainer.appendChild(popupPreviewScrollbarSVG);
    popupPreviewScrollbarSVG.classList.add(
      "sa-mcp-preview-scrollbar",
      "blocklyScrollbarVertical",
      "blocklyMainWorkspaceScrollbar",
    );
    popupPreviewScrollbarSVG.style.display = "none";

    const popupPreviewScrollbarBackground = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    popupPreviewScrollbarSVG.appendChild(popupPreviewScrollbarBackground);
    popupPreviewScrollbarBackground.setAttribute("width", "11");
    popupPreviewScrollbarBackground.classList.add("blocklyScrollbarBackground");

    const popupPreviewBlocks = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    popupPreviewContainer.appendChild(popupPreviewBlocks);
    popupPreviewBlocks.classList.add("sa-mcp-preview-blocks");

    return {
      popupRoot,
      popupContainer,
      popupInput,
      popupInputContainer,
      popupInputSuggestion,
      popupPreviewContainer,
      popupPreviewBlocks,
      popupPreviewScrollbarSVG,
      popupPreviewScrollbarBackground,
    };
  };

  // 创建所有DOM元素
  const elements = createElement();

  const {
    popupRoot,
    popupContainer,
    popupInput,
    popupInputContainer,
    popupInputSuggestion,
    popupPreviewContainer,
    popupPreviewBlocks,
    popupPreviewScrollbarSVG,
    popupPreviewScrollbarBackground,
  } = elements;

  const virtualScroller = new VirtualScroller(popupPreviewBlocks);

  // 添加事件监听器的辅助函数
  const addCleanupListener = <K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document,
    event: K,
    handler: (ev: HTMLElementEventMap[K]) => void,
  ): void => {
    element.addEventListener(event, handler);
    cleanupListeners.add(() => element.removeEventListener(event, handler));
  };

  // 添加事件监听器的辅助函数 (SVG元素版本)
  const addCleanupListenerSVG = <K extends keyof SVGElementEventMap>(
    element: SVGElement,
    event: K,
    handler: (ev: SVGElementEventMap[K]) => void,
  ): void => {
    element.addEventListener(event, handler);
    cleanupListeners.add(() => element.removeEventListener(event, handler));
  };

  // 替换原有的事件监听器添加方式
  addCleanupListener(document, "mousemove", (e: MouseEvent) => {
    mousePosition = { x: e.clientX, y: e.clientY };
  });

  const querier = new WorkspaceQuerier();

  onClearTextWidthCache(closePopup);

  const queryPreviews: ItemData[] = [];
  let queryIllegalResult: QueryResult | null = null;
  let selectedPreviewIdx = 0;
  let blockTypes: BlockTypeInfo[] | null = null;
  let limited = false;

  let allowMenuClose = true;

  let popupPosition = null;
  let popupOrigin = null;

  let previewWidth = 0;
  let previewHeight = 0;

  let previewScale = 0;

  const previewMinHeight = 0;
  let previewMaxHeight = 0;

  let settingPopupScale = 48;
  let settingPopupWidth = 25;
  let settingPopupMaxHeight = 40;

  function openPopup() {
    blockTypes = BlockTypeInfo.getBlocks(Blockly, vm, Blockly.getMainWorkspace(), msg);
    querier.indexWorkspace([...blockTypes]);
    blockTypes.sort((a, b) => {
      const prio = (block) => ["operators", "data"].indexOf(block.category.name) - block.id.startsWith("data_");
      return prio(b) - prio(a);
    });

    previewScale = window.innerWidth * 0.00005 + settingPopupScale / 100;
    previewWidth = (window.innerWidth * settingPopupWidth) / 100;
    previewMaxHeight = (window.innerHeight * settingPopupMaxHeight) / 100;

    popupContainer.style.width = previewWidth + "px";

    popupOrigin = { x: mousePosition.x, y: mousePosition.y };
    popupRoot.style.display = "";
    popupInput.value = "";
    popupInput.focus();
    updateInput();
  }

  addCleanupListener(popupInput, "focusout", closePopup);

  function closePopup() {
    if (allowMenuClose) {
      popupOrigin = null;
      popupPosition = null;
      popupRoot.style.display = "none";
      blockTypes = null;
      querier.clearWorkspaceIndex();
    }
  }

  const getResultItemIdx = (target: SVGAElement | HTMLElement) => {
    let index = -1;
    while (target) {
      if (target.getAttribute("data-fastInputSearchResultItemIdx")) {
        index = Number(target.getAttribute("data-fastInputSearchResultItemIdx"));
        break;
      } else {
        target = target.parentElement as HTMLElement;
      }
    }
    return index;
  };

  const mouseMoveListener = (e: MouseEvent) => {
    const index = getResultItemIdx(e.target as SVGAElement);
    if (index !== -1) {
      updateSelection(index);
    }
  };

  const mouseDownListener = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const index = getResultItemIdx(e.target as SVGAElement);
    if (index !== -1) {
      updateSelection(index);
      allowMenuClose = !e.shiftKey;
      selectBlock();
      allowMenuClose = true;
      if (e.shiftKey) popupInput.focus();
    }
  };

  addCleanupListenerSVG(popupPreviewBlocks, "mousemove", mouseMoveListener);
  addCleanupListenerSVG(popupPreviewBlocks, "mousedown", mouseDownListener);

  const renderPreviewItem: RenderItemFunc = ({ block, blockHeight, blockPositionY, blockIndex }) => {
    const blockBackground = popupPreviewBlocks.appendChild(
      document.createElementNS("http://www.w3.org/2000/svg", "rect"),
    );
    blockBackground.setAttribute("data-fastInputSearchResultItemIdx", String(blockIndex));
    blockBackground.setAttribute("height", blockHeight * previewScale + "px");
    blockBackground.setAttribute("transform", `translate(0, ${(blockPositionY + blockHeight / 10) * previewScale})`);
    blockBackground.classList.add("sa-mcp-preview-block-bg");

    const blockContent = popupPreviewBlocks.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
    blockContent.classList.add("sa-mcp-preview-block");

    const renderedBlock = renderBlock(block, blockContent);
    blockContent.setAttribute("data-fastInputSearchResultItemIdx", String(blockIndex));
    blockContent.setAttribute(
      "transform",
      `translate(5, ${(blockPositionY + 30) * previewScale}) scale(${previewScale})`,
    );

    return { blockBackground, blockContent, renderedBlock };
  };

  async function updateInput() {
    const blockList: MenuItem[] = [];
    const value = popupInput.value.trim();

    if (value.length === 0) {
      queryIllegalResult = null;
      if (blockTypes)
        for (const blockType of blockTypes) {
          blockList.push({
            block: blockType.createBlock(),
          });
        }
      limited = false;
    } else {
      if (querier.workspaceIndexed !== true) {
        requestAnimationFrame(updateInput);
        return;
      }
      // Get the list of blocks to display using the input content
      const queryResultObj = querier.queryWorkspace(value);
      const queryResults = queryResultObj.results;
      queryIllegalResult = queryResultObj.illegalResult;
      limited = queryResultObj.limited;

      if (queryResults.length > PREVIEW_LIMIT) queryResults.length = PREVIEW_LIMIT;

      for (const queryResult of queryResults) {
        blockList.push({
          block: queryResult.getBlock(),
          autocompleteFactory: (endOnly) => queryResult.toText(endOnly),
        });
      }
    }

    // 清空已渲染的选项和数据
    popupPreviewBlocks.innerHTML = "";
    queryPreviews.length = 0;

    let y = 0;
    for (let index = 0; index < blockList.length; index++) {
      const { block, autocompleteFactory } = blockList[index];
      const height = getBlockHeight(block);
      queryPreviews.push({
        block,
        autocompleteFactory: autocompleteFactory ?? null,
        blockHeight: height,
        blockPositionY: y,
        blockIndex: index,
      });

      y += height;
    }
    const height = (y + 8) * previewScale;

    if (height < previewMinHeight) previewHeight = previewMinHeight;
    else if (height > previewMaxHeight) previewHeight = previewMaxHeight;
    else previewHeight = height;

    popupPreviewBlocks.setAttribute("height", `${height}px`);
    popupPreviewContainer.style.height = previewHeight + "px";
    popupPreviewScrollbarSVG.style.height = previewHeight + "px";
    popupPreviewScrollbarBackground.setAttribute("height", "" + previewHeight);
    popupInputContainer.dataset["error"] = "" + limited;

    popupPosition = { x: popupOrigin.x + 16, y: popupOrigin.y - 8 };

    const popupHeight = popupContainer.getBoundingClientRect().height;
    const popupBottom = popupPosition.y + popupHeight;
    if (popupBottom > window.innerHeight) {
      popupPosition.y -= popupBottom - window.innerHeight;
    }
    virtualScroller.init({
      containerHeight: previewHeight,
      itemScale: previewScale,
      itemDataList: queryPreviews,
      renderItem: renderPreviewItem,
    });

    popupRoot.style.top = popupPosition.y + "px";
    popupRoot.style.left = popupPosition.x + "px";

    selectedPreviewIdx = -1;
    updateSelection(0);
    updateCursor();
  }

  addCleanupListener(popupInput, "input", updateInput);

  function updateSelection(newIdx: number) {
    if (selectedPreviewIdx === newIdx) return;

    const inputValue = popupInput.value;

    if (queryPreviews.length === 0 && queryIllegalResult) {
      popupInputSuggestion.value = inputValue + queryIllegalResult.toText(true).substring(inputValue.length);
      return;
    }

    const newSelection = queryPreviews[newIdx];
    if (newSelection && newSelection.autocompleteFactory) {
      virtualScroller.selectItem(newIdx);

      popupInputSuggestion.value = inputValue + newSelection.autocompleteFactory(true).substring(inputValue.length);
    } else {
      popupInputSuggestion.value = "";
    }

    selectedPreviewIdx = newIdx;
  }

  addCleanupListener(document, "selectionchange", updateCursor);

  function updateCursor() {
    const cursorPos = popupInput.selectionStart ?? 0;
    const cursorPosRel = popupInput.value.length === 0 ? 0 : cursorPos / popupInput.value.length;

    for (let previewIdx = 0; previewIdx < queryPreviews.length; previewIdx++) {
      const preview = queryPreviews[previewIdx];

      let blockX = 5;
      if (preview.renderedBlock && blockX + preview.renderedBlock.width > previewWidth / previewScale) {
        blockX += (previewWidth / previewScale - blockX - preview.renderedBlock.width) * previewScale * cursorPosRel;
        const oldAttribute = preview.blockContent.getAttribute("transform");
        preview.blockContent.setAttribute("transform", oldAttribute.replace("translate(5,", `translate(${blockX},`));
      }
    }

    popupInputSuggestion.scrollLeft = popupInput.scrollLeft;
  }

  function selectBlock() {
    const selectedPreview = queryPreviews[selectedPreviewIdx];
    if (!selectedPreview) return;

    const workspace = Blockly.getMainWorkspace();
    // This is mostly copied from https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/scratch_blocks_utils.js#L171
    // Some bits were removed or changed to fit our needs.
    workspace.setResizesEnabled(false);

    let newBlock;
    Blockly.Events.disable();
    try {
      newBlock = selectedPreview.block.createWorkspaceForm();
      Blockly.scratchBlocksUtils.changeObscuredShadowIds(newBlock);

      const svgRootNew = newBlock.getSvgRoot();
      if (!svgRootNew) {
        throw new Error("newBlock is not rendered.");
      }

      const blockBounds = newBlock.svgPath_.getBoundingClientRect();
      const newBlockX = Math.floor((mousePosition.x - (blockBounds.left + blockBounds.right) / 2) / workspace.scale);
      const newBlockY = Math.floor((mousePosition.y - (blockBounds.top + blockBounds.bottom) / 2) / workspace.scale);
      newBlock.moveBy(newBlockX, newBlockY);
    } finally {
      Blockly.Events.enable();
    }
    if (Blockly.Events.isEnabled()) {
      Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
    }

    const fakeEvent = {
      clientX: mousePosition.x,
      clientY: mousePosition.y,
      type: "mousedown",
      stopPropagation: function () {},
      preventDefault: function () {},
      target: selectedPreview.blockContent,
    };
    if (workspace.getGesture(fakeEvent)) {
      workspace.startDragWithFakeEvent(fakeEvent, newBlock);
    }
  }

  function acceptAutocomplete() {
    let factory;
    if (queryPreviews[selectedPreviewIdx]) factory = queryPreviews[selectedPreviewIdx].autocompleteFactory;
    else factory = () => popupInputSuggestion.value;
    if (popupInputSuggestion.value.length === 0 || !factory) return;
    popupInput.value = factory(false);
    // Move cursor to the end of the newly inserted text
    popupInput.selectionStart = popupInput.value.length + 1;
    updateInput();
  }

  addCleanupListener(popupInput, "keydown", handleInputKeydown);

  function handleInputKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "Escape":
        // If there's something in the input, clear it
        if (popupInput.value.length > 0) {
          popupInput.value = "";
          updateInput();
        } else {
          // If not, close the menu
          closePopup();
        }
        e.stopPropagation();
        e.preventDefault();
        break;
      case "Tab":
        acceptAutocomplete();
        e.stopPropagation();
        e.preventDefault();
        break;
      case "Enter":
        selectBlock();
        closePopup();
        e.stopPropagation();
        e.preventDefault();
        break;
      case "ArrowDown":
        if (selectedPreviewIdx + 1 >= queryPreviews.length) updateSelection(0);
        else updateSelection(selectedPreviewIdx + 1);
        e.stopPropagation();
        e.preventDefault();
        break;
      case "ArrowUp":
        if (selectedPreviewIdx - 1 < 0) updateSelection(queryPreviews.length - 1);
        else updateSelection(selectedPreviewIdx - 1);
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  }

  // 保存原始的 Blockly 方法
  const originalDoWorkspaceClick = Blockly.Gesture.prototype.doWorkspaceClick_;
  const originalIsDeleteArea = Blockly.WorkspaceSvg.prototype.isDeleteArea;

  // 修改 Blockly 方法
  Blockly.Gesture.prototype.doWorkspaceClick_ = function (this: { mostRecentEvent_: MouseEvent }): void {
    if (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey) {
      openPopup();
    }
    mousePosition = { x: this.mostRecentEvent_.clientX, y: this.mostRecentEvent_.clientY };
    originalDoWorkspaceClick.call(this);
  };

  Blockly.WorkspaceSvg.prototype.isDeleteArea = function (this: unknown, e: MouseEvent): boolean {
    if (popupPosition) {
      if (
        e.clientX > popupPosition.x &&
        e.clientX < popupPosition.x + previewWidth &&
        e.clientY > popupPosition.y &&
        e.clientY < popupPosition.y + previewHeight
      ) {
        return Blockly.DELETE_AREA_TOOLBOX;
      }
    }
    return originalIsDeleteArea.call(this, e);
  };

  const register = registerSettings(
    msg("plugins.fastInput.title"),
    "plugin-fast-input",
    [
      {
        key: "fastInput",
        label: msg("plugins.fastInput.title"),
        description: msg("plugins.fastInput.description"),
        items: [
          {
            key: "popup_scale",
            label: msg("plugins.fastInput.popup_scale"),
            type: "input",
            inputProps: {
              type: "number",
            },
            value: 48,
            onChange: (value: number) => {
              settingPopupScale = value;
            },
          },
          {
            key: "popup_width",
            label: msg("plugins.fastInput.popup_width"),
            type: "input",
            inputProps: {
              type: "number",
            },
            value: 25,
            onChange: (value: number) => {
              settingPopupWidth = value;
            },
          },
          {
            key: "popup_max_height",
            label: msg("plugins.fastInput.popup_max_height"),
            type: "input",
            inputProps: {
              type: "number",
            },
            value: 40,
            onChange: (value: number) => {
              settingPopupMaxHeight = value;
            },
          },
        ],
      },
    ],
    React.createElement(FastInputIcon),
  );

  return {
    dispose: () => {
      // 恢复原始的 Blockly 方法
      Blockly.Gesture.prototype.doWorkspaceClick_ = originalDoWorkspaceClick;
      Blockly.WorkspaceSvg.prototype.isDeleteArea = originalIsDeleteArea;

      // 移除所有事件监听器
      cleanupListeners.forEach((cleanup) => cleanup());
      cleanupListeners.clear();

      virtualScroller.dispose();

      // 移除所有创建的DOM元素
      if (popupRoot.parentNode) {
        popupRoot.parentNode.removeChild(popupRoot);
      }

      // 清理缓存
      blockTypes = null;
      querier.clearWorkspaceIndex();

      popupPosition = null;
      popupOrigin = null;
      queryPreviews.length = 0;
      queryIllegalResult = null;
      register.dispose();
    },
  };
};

export default FastInput;
