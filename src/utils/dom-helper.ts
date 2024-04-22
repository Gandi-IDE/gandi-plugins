export default class DomHelpers {
  events: Array<unknown>;

  constructor() {
    this.events = [];
  }

  triggerDragAndDrop(
    selectorDrag: SVGPathElement,
    selectorDrop: HTMLElement,
    mouseXY: { x: number; y: number },
    shiftKey: boolean,
  ) {
    // function for triggering mouse events
    shiftKey = shiftKey || false;

    const fireMouseEvent = function (type: string, elem: EventTarget | null, centerX: number, centerY: number) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(type, true, true, window, 1, 1, 1, centerX, centerY, shiftKey, false, false, false, 0, elem);
      elem?.dispatchEvent(evt);
    };

    // fetch target elements
    const elemDrag = selectorDrag; // document.querySelector(selectorDrag);
    const elemDrop = selectorDrop; // document.querySelector(selectorDrop);
    if (!elemDrag /* || !elemDrop*/) {
      return false;
    }

    // calculate positions
    let pos = elemDrag.getBoundingClientRect();
    const center1X = Math.floor((pos.left + pos.right) / 2);
    const center1Y = Math.floor((pos.top + pos.bottom) / 2);

    // mouse over dragged element and mousedown
    fireMouseEvent("mouseover", elemDrag, center1X, center1Y);
    fireMouseEvent("mousedown", elemDrag, center1X, center1Y);

    // start dragging process over to drop target
    fireMouseEvent("dragstart", elemDrag, center1X, center1Y);
    fireMouseEvent("drag", elemDrag, center1X, center1Y);
    fireMouseEvent("mousemove", elemDrag, center1X, center1Y);

    if (!elemDrop) {
      if (mouseXY) {
        const center2X = mouseXY.x;
        const center2Y = mouseXY.y;
        fireMouseEvent("drag", elemDrag, center2X, center2Y);
        fireMouseEvent("mousemove", elemDrag, center2X, center2Y);
      }
      return false;
    }

    pos = elemDrop.getBoundingClientRect();
    const center2X = Math.floor((pos.left + pos.right) / 2);
    const center2Y = Math.floor((pos.top + pos.bottom) / 2);

    fireMouseEvent("drag", elemDrag, center2X, center2Y);
    fireMouseEvent("mousemove", elemDrop, center2X, center2Y);

    // trigger dragging process on top of drop target
    fireMouseEvent("mouseenter", elemDrop, center2X, center2Y);
    fireMouseEvent("dragenter", elemDrop, center2X, center2Y);
    fireMouseEvent("mouseover", elemDrop, center2X, center2Y);
    fireMouseEvent("dragover", elemDrop, center2X, center2Y);

    // release dragged element on top of drop target
    fireMouseEvent("drop", elemDrop, center2X, center2Y);
    fireMouseEvent("dragend", elemDrag, center2X, center2Y);
    fireMouseEvent("mouseup", elemDrag, center2X, center2Y);

    return true;
  }
}
