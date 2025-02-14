import { BlockComponent } from "./BlockRenderer";
import { BlockInstance } from "./BlockTypeInfo";

/**
 * Represents the data structure for an item in the virtual scroller.
 */
export interface ItemData {
  /** The block instance associated with this item. */
  block: BlockInstance;
  /** Function to generate autocomplete suggestions. */
  autocompleteFactory?: (endOnly: boolean) => string | null;
  /** The height of the block. */
  blockHeight: number;
  /** The index of the block in the list. */
  blockIndex: number;
  /** The vertical position of the block. */
  blockPositionY: number;
  /** The rendered block component, if available. */
  renderedBlock?: BlockComponent;
  /** The background SVG element of the block. */
  blockBackground?: SVGRectElement;
  /** The content SVG element of the block. */
  blockContent?: SVGGElement;
}

/**
 * Defines a function type for rendering an item in the virtual scroller.
 */
export interface RenderItemFunc {
  /**
   * Renders an item.
   * @param itemData - The data for the item to be rendered.
   * @returns An object containing the background and content SVG elements.
   */
  (itemData: ItemData): {
    blockBackground: SVGRectElement;
    blockContent: SVGGElement;
  };
}

/**
 * Represents a selected item in the virtual scroller.
 */
interface SelectedItem extends ItemData {
  /** The background SVG element of the selected block. */
  blockBackground: SVGRectElement;
  /** The content SVG element of the selected block. */
  blockContent: SVGGElement;
}

/**
 * A virtual scroller for rendering and managing a list of blocks efficiently.
 */
export default class VirtualScroller {
  /** Scaling factor for item heights. */
  private itemScale = 1;
  /** The main container for the scroller. */
  private container: SVGSVGElement;
  /** The height of the container. */
  private containerHeight: number;
  /** The height of each item in the list. */
  private itemHeight: number;
  /** Function to render individual items. */
  private renderItem: RenderItemFunc;
  /** The starting index of the currently visible items. */
  private startIndex = 0;
  /** The number of items currently visible in the scroller. */
  private visibleCount = 0;
  /** The currently selected item, if any. */
  private selectedItem: SelectedItem | null = null;
  /** The list of item data used for rendering. */
  private itemDataList: ItemData[];

  /**
   * Creates an instance of VirtualScroller.
   * @param container - The SVG container for the virtual scroller.
   */
  constructor(container: SVGSVGElement) {
    this.container = container;
    this.container.parentElement.addEventListener("scroll", this.onScroll);
  }

  /**
   * Updates the number of visible items based on the container's height.
   */
  private updateVisibleCount() {
    let count = 0;
    let y = 0;
    for (let index = 0; index < this.itemDataList.length; index++) {
      const item = this.itemDataList[index];
      if (y + item.blockHeight * this.itemScale <= this.containerHeight) {
        y += item.blockHeight * this.itemScale;
        count++;
      } else {
        count += 2; // Ensures a small buffer of extra items.
        break;
      }
    }
    this.visibleCount = count;
  }

  /**
   * Renders the virtual scroller by clearing the container and updating the display.
   */
  private render(): void {
    this.container.innerHTML = "";
    this.container.parentElement.scrollTop = 0;
    this.update();
  }

  /**
   * Handles scrolling events to update the visible items dynamically.
   */
  private onScroll(): void {
    const scrollTop = this.container.parentElement.scrollTop;
    let y = 0;
    const newStartIndex = this.itemDataList.findIndex((item) => {
      const height = item.blockHeight * this.itemScale;
      if (y + height >= scrollTop) {
        return true;
      }
      y += height;
      return false;
    });

    if (newStartIndex !== this.startIndex) {
      this.startIndex = newStartIndex;
      this.update();
    }
  }

  /**
   * Updates the list of visible items by rendering them.
   */
  private update(): void {
    for (let i = 0; i < this.visibleCount; i++) {
      const idx = this.startIndex + i;
      if (idx < this.itemDataList.length && !this.itemDataList[idx].blockContent) {
        const item = this.renderItem(this.itemDataList[idx]);
        Object.assign(this.itemDataList[idx], item);
      }
    }
  }

  /**
   * Initializes the virtual scroller with necessary data and settings.
   * @param options - Configuration options for the virtual scroller.
   */
  public init({
    itemScale,
    itemDataList,
    containerHeight,
    renderItem,
  }: {
    containerHeight: number;
    itemScale: number;
    itemDataList: ItemData[];
    renderItem: RenderItemFunc;
  }) {
    this.containerHeight = containerHeight;
    this.itemDataList = itemDataList;
    this.itemScale = itemScale;
    this.renderItem = renderItem;
    this.startIndex = 0;
    this.updateVisibleCount();

    this.render();
  }

  /**
   * Selects an item in the virtual scroller and updates the UI accordingly.
   * @param index - The index of the item to select.
   */
  public selectItem(index: number): void {
    if (index < 0 || index >= this.itemDataList.length) return;

    // Deselect the previously selected item, if any.
    if (this.selectedItem) {
      this.selectedItem.blockBackground.classList.remove("sa-mcp-preview-block-bg-selection");
      this.selectedItem.blockContent.classList.remove("sa-mcp-preview-block-selection");
    }

    const relativeIndex = index - this.startIndex;

    // Adjust scrolling if the selected item is out of the current visible range.
    if (relativeIndex < 0) {
      this.container.parentElement.scrollTop = this.itemDataList[index].blockPositionY;
      this.startIndex = index;
    } else if (relativeIndex >= this.visibleCount) {
      const idx = index - this.visibleCount + 1;
      this.container.parentElement.scrollTop = this.itemDataList[idx].blockPositionY;
      this.startIndex = idx;
    }

    this.update();

    // Apply selection styles if the item is within the visible range.
    const newRelativeIndex = index - this.startIndex;
    if (newRelativeIndex >= 0 && newRelativeIndex < this.visibleCount) {
      this.selectedItem = this.itemDataList[index] as SelectedItem;
      this.selectedItem.blockBackground.classList.add("sa-mcp-preview-block-bg-selection");
      this.selectedItem.blockContent.classList.add("sa-mcp-preview-block-selection");
    }
  }

  dispose(): void {
    this.container?.parentElement?.removeEventListener("scroll", this.onScroll);
  }
}
