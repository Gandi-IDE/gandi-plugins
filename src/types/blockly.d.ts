declare type UnKnownFunction = (...args: unknown[]) => void;

declare namespace Blockly {
  type DeletionCallbackFunc = (block: BlockSvg, undoFunc: UnKnownFunction, ws: Blockly.Workspace) => boolean | void;

  type cheeryPickedBlocks = any[];
  type selected = any;

  type Metrics = {
    viewHeight: number;
    viewWidth: number;
    contentHeight: number;
    contentWidth: number;
    viewTop: number;
    viewLeft: number;
    contentTop: number;
    contentLeft: number;
    absoluteTop: number;
    absoluteLeft: number;
    flyoutHeight?: number;
    flyoutWidth?: number;
    toolboxHeight?: number;
    toolboxPosition?: number;
    toolboxWidth?: number;
  };

  export interface Connection {
    type: string;
    checkType_(otherConnection: Connection): boolean;
    targetConnection?: Connection;
    disconnect(): void;
    isConnected?: () => boolean;
    connect(otherConnection: Blockly.Connection): void;
  }

  export interface ScratchBubble {
    relativeLeft_: number;
    relativeTop_: number;
    height_: number;
    width_: number;
    rendered: boolean;
    bubbleGroup_: SVGGElement;
  }

  export interface ScratchBlockComment {
    blockId: string;
    block_: Blockly.Block;
    bubble_: Blockly.ScratchBubble;
  }

  export interface Block {
    RTL: boolean;
    category_: string;
    checkboxInFlyout_: boolean;
    boxed?: boolean;
    childBlocks_: Array<Block>;
    collapsed_: boolean;
    colourSecondary_: string;
    colourTertiary_: string;
    colour_: string;
    comment: null | ScratchBlockComment;
    contextMenu: boolean;
    deletable_: boolean;
    disabled: boolean;
    edgeShapeWidth_: number;
    edgeShape_: unknown;
    editable_: boolean;
    eventsInit_: boolean;
    flyoutRect_: HTMLOrSVGElement;
    frame_: Frame | null;
    height: number;
    id: string;
    intersects_?: boolean;
    getSvgRoot: () => SVGElement;
    getChildren(ordered: boolean): Array<Blockly.Block>;
    getFieldValue(name: string): string | null;
    getProcCode(this: Blockly.Block): string;
    unplug(opt_healStack: boolean): void;
    getHeightWidth(): { height: number; width: number };
    temporaryCoordinate?: Coordinate & { width: number; height: number };
    inputList: Array<{
      connection: null | {
        hidden_: boolean;
        type: number;
        x_: number;
        y_: number;
        targetBlock: () => null | Block;
      };
      fieldRow: Array<FieldTextInput>;
      fieldWidth: number;
      name: string;
      outlinePath: null;
      renderHeight: number;
      renderWidth: number;
      sourceBlock_: Blockly.Block;
      type: number;
    }>;
    inputsInline: boolean;
    inputsInlineDefault: boolean;
    isInFlyout: boolean;
    isInMutator: boolean;
    isInsertionMarker_: boolean;
    isShadow_: boolean;
    movable_: boolean;
    nextConnection: any;
    outputConnection: unknown;
    outputShape_: unknown;
    parentBlock_: any;
    previousConnection: Connection;
    rendered: boolean;
    squareTopLeftCorner_: boolean;
    startHat_: boolean;
    svgGroup_: SVGGElement;
    svgPath_: SVGPathElement;
    tooltip: string;
    type: string;
    useDragSurface_: boolean;
    width: number;
    workspace: Workspace;
    isShadow(): boolean;
    isSelectable(): boolean;
    isInFrame(): Frame;
    getRootBlock: () => Block;
    getNextBlock: () => Block;
    getConnections_(all?: boolean): Array<Connection>;
    getSurroundParent: () => null | Block;
    getRelativeToSurfaceXY: () => {
      x: number;
      y: number;
    };
    removeInput(name: string, opt_quiet?: boolean | undefined): void;
    removeSelect(): void;
    render(): void;
    setOutputShape(outputShape: number | null): void;
    getOutputShape(): number | null;
    moveBy(dx: number, dy: number): void;
    dispose(healStack?: boolean, animate?: boolean): void;
  }

  export interface Frame {
    id: string;
    RTL: boolean;
    boxed?: boolean;
    locked: boolean;
    blockDB_: Record<string, Blockly.Block>;
    temporaryCoordinate?: Coordinate & { width: number; height: number };
    svgRect_: SVGRectElement;
    selected: boolean;
    getSvgRoot(): SVGGElement;
    getWidth(): number;
    getHeight(): number;
    getHeightWidth(): { height: number; width: number };
    getBoundingFrameRect(): {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    select(): void;
    unselect(): void;
    dispose(retainBlocks?: boolean): void;
  }

  export interface Workspace {
    MAX_UNDO: number;
    addChangeListener<T extends (...args: unknown[]) => void>(listener: T): T;
    addDeletionListener(callback: DeletionCallbackFunc): DeletionCallbackFunc | undefined;
    addTopBlock(block: Blockly.Block): void;
    addTopComment(comment: Comment): void;
    allInputsFilled(opt_shadowBlocksAreFilled?: boolean | undefined): boolean;
    clear(): void;
    clearUndo(): void;
    createGlobalProcedure(mutation: HTMLElement): void;
    createPotentialVariableMap(): void;
    id: string;
    createVariable(
      name: string,
      opt_type: string | null,
      opt_id?: string | undefined,
      opt_isLocal?: boolean | undefined,
      opt_isCloud?: boolean | undefined,
    ): VariableModel | null;
    blockDB_: Record<string, Blockly.Block>;
    deleteVariableById(id: string): void;
    deleteVariableInternal_(variable: VariableModel, uses: Array<Block>): void;
    dispose(): void;
    fireChangeListener(event: Events.Abstract): void;
    fireDeletionListeners(block: BlockSvg, undoFunc?: UnKnownFunction | undefined): void;
    forceDeleteVariableById(id: string): void;
    getAllBlocks(ordered?: boolean): Array<BlockSvg>;
    getAllGlobalProcedureMutations(): unknown;
    getAllVariables(): Array<VariableModel>;
    getBlockById(id: string): Blockly.Block;
    getCommentById(id: string): WorkspaceComment;
    getFlyout(): Flyout | null;
    getGlobalProcedureMutationByProccode(proccode: unknown): unknown;
    getPotentialVariableMap(): Blockly.VariableMap | null;
    getTopBlocks(ordered?: boolean): Array<Blockly.Block>;
    getTopComments(ordered: boolean): Array<Blockly.WorkspaceComment>;
    getVariable(name: string, opt_type?: string | undefined): Blockly.VariableModel | null;
    getVariableById(id: string): Blockly.VariableModel | null;
    getVariableMap(): Blockly.VariableMap | null;
    getVariableTypes(): Array<string>;
    getVariableUsesById(id: string): Array<Blockly.Block>;
    getVariablesOfType(type: string | null): Array<Blockly.VariableModel>;
    getWidth(): number;
    hasRedoStack(): boolean;
    hasUndoStack(): boolean;
    isClearing(): boolean;
    newBlock(prototypeName: string | null, opt_id?: string | undefined): Blockly.Block;
    refreshToolboxSelection_(): void;
    removeChangeListener(func: UnKnownFunction): void;
    removeDeletionListener(callback: DeletionCallbackFunc): DeletionCallbackFunc;
    removeTopBlock(block: Blockly.Block): void;
    removeTopComment(comment: Blockly.WorkspaceComment): void;
    renameVariableById(id: string, newName: string, not_fire_event: boolean): void;
    rendered: boolean;
    undo(redo?: boolean | undefined): void;
    paste(xmlBlock: Element): void;
    variableIndexOf(_name: string): number;
    getScratchBlocks: () => any;
    getScratchBlocksBlocks: () => Record<string, { init: () => void }>;
    parseControlStopBlock: (block: RuntimeBlocksData) => string;
  }

  export interface WorkspaceSvg extends Workspace {
    new (
      options: Blockly.Options,
      opt_blockDragSurface?: Blockly.BlockDragSurfaceSvg | undefined,
      opt_wsDragSurface?: Blockly.WorkspaceDragSurfaceSvg | undefined,
    ): void;
    getMetrics(): Metrics | null;
    getTopFrames(ordered?: boolean): Array<Blockly.Frame>;
    resizeHandlerWrapper_: null | Array<unknown>;
    rendered: boolean;
    isVisible_: boolean;
    id: string;
    isFlyout: boolean;
    isMutator: boolean;
    resizesEnabled_: boolean;
    toolboxRefreshEnabled_: boolean;
    scrollX: number;
    scrollY: number;
    startScrollX: number;
    startScrollY: number;
    dragDeltaXY_: Coordinate;
    scale: number;
    trashcan: Blockly.Trashcan | null;
    scrollbar: Blockly.ScrollbarPair | null;
    currentGesture_: Blockly.Gesture | null;
    blockDragSurface_: Blockly.BlockDragSurfaceSvg | null;
    workspaceDragSurface_: Blockly.WorkspaceDragSurfaceSvg;
    useWorkspaceDragSurface_: boolean;
    isDragSurfaceActive_: boolean;
    injectionDiv_: Element | null;
    lastRecordedPageScroll_: Coordinate | null;
    flyoutButtonCallbacks_: {
      [x: string]: (arg0: Blockly.FlyoutButton) => unknown;
    };
    toolboxCategoryCallbacks_: {
      [x: string]: (arg0: Blockly.Workspace) => Array<Element>;
    };
    inverseScreenCTM_: DOMMatrix;
    inverseScreenCTMDirty_: boolean;
    getInverseScreenCTM(): SVGMatrix;
    isVisible(): boolean;
    updateInverseScreenCTM(): void;
    getSvgXY(element: Element): Coordinate;
    getOriginOffsetInPixels(): Coordinate;
    getInjectionDiv(): Element;
    setResizeHandlerWrapper(handler: Array<unknown[]>): void;
    createDom(opt_backgroundClass?: string | undefined): Element;
    dispose(): void;
    newBlock(prototypeName: string | null, opt_id?: string | undefined): Blockly.BlockSvg;
    addTrashcan_(bottom: number): number;
    getFlyout(): Blockly.Flyout;
    getToolbox(): Blockly.Toolbox;
    updateScreenCalculations_(): void;
    resizeContents(): void;
    resize(): void;
    updateScreenCalculationsIfScrolled(): void;
    getCanvas(): Element;
    getBubbleCanvas(): SVGGElement;
    getParentSvg(): Element;
    translate(x: number, y: number): void;
    resetDragSurface(): void;
    setupDragSurface(): void;
    getBlockDragSurface(): Blockly.BlockDragSurfaceSvg | null;
    getWidth(): number;
    setVisible(isVisible: boolean): void;
    render(): void;
    traceOn(): void;
    highlightBlock(id: string | null, opt_state?: boolean | undefined): void;
    glowBlock(id: string | null, isGlowingBlock: boolean): void;
    glowStack(id: string | null, isGlowingStack: boolean): void;
    reportValue(id: string | null, value: string | null): void;
    paste(xmlBlock: Element): void;
    pasteBlock_(xmlBlock: Element): void;
    pasteWorkspaceComment_(xmlComment: Element): void;
    refreshToolboxSelection_(): void;
    renameVariableById(id: string, newName: string, not_fire_event: boolean): void;
    deleteVariableById(id: string): void;
    forceDeleteVariableById(id: string): void;
    createVariable(
      name: string,
      opt_type?: string | undefined,
      opt_id?: string | undefined,
      opt_isLocal?: boolean | undefined,
      opt_isCloud?: boolean | undefined,
    ): Blockly.VariableModel | null;
    recordCachedAreas(): void;
    recordDeleteAreas_(): void;
    recordBlocksArea_(): void;
    isDeleteArea(e: Event): number | null;
    isInsideBlocksArea(e: Event): boolean;
    onMouseDown_(e: Event): void;
    startDrag(e: Event, xy: Coordinate): void;
    moveDrag(e: Event): Coordinate;
    isDragging(): boolean;
    isDraggable(): boolean;
    onMouseWheel_(e: Event): void;
    getBlocksBoundingBox(): unknown;
    cleanUp(): void;
    showContextMenu_(e: Event): void;
    buildDeleteList_(topBlocks: Array<Blockly.BlockSvg>): Array<Blockly.BlockSvg>;
    updateToolbox(tree: Node | string): void;
    markFocused(): void;
    setBrowserFocus(): void;
    zoom(x: number, y: number, amount: number): void;
    zoomCenter(type: number): void;
    zoomToFit(): void;
    scrollCenter(): void;
    centerOnBlock(id: string | null): void;
    centerOnFirstComment(offsetX: number, offsetY: number): void;
    setScale(newScale: number): void;
    scroll(x: number, y: number): void;
    updateStackGlowScale_(): void;
    getDimensionsPx_(elem: Blockly.Toolbox | Blockly.Flyout): unknown;
    getContentDimensions_(ws: Blockly.WorkspaceSvg, svgSize: unknown): unknown;
    getContentDimensionsExact_(ws: Blockly.WorkspaceSvg): unknown;
    getContentDimensionsBounded_(ws: Blockly.WorkspaceSvg, svgSize: unknown): unknown;
    getTopLevelWorkspaceMetrics_(this: WorkspaceSvg): unknown;
    setTopLevelWorkspaceMetrics_(this: WorkspaceSvg, xyRatio: unknown): void;
    setResizesEnabled(enabled: boolean): void;
    setToolboxRefreshEnabled(enabled: boolean): void;
    clear(): void;
    registerButtonCallback(key: string, func: (arg0: Blockly.FlyoutButton) => unknown): void;
    getButtonCallback(key: string): ((arg0: Blockly.FlyoutButton) => unknown) | null;
    removeButtonCallback(key: string): void;
    registerToolboxCategoryCallback(key: string, func: (arg0: Blockly.Workspace) => Array<Element>): void;
    getToolboxCategoryCallback(key: string): ((arg0: Blockly.Workspace) => Array<Element>) | null;
    removeToolboxCategoryCallback(key: string): void;
    getGesture(e: Event): Blockly.Gesture;
    clearGesture(): void;
    cancelCurrentGesture(): void;
    startDragWithFakeEvent(fakeEvent: unknown, block: Blockly.BlockSvg): void;
    getAudioManager(): Blockly.WorkspaceAudio;
    getGrid(): Blockly.Grid;
    getTargetCostumeData: (asset: Scratch.Asset) => string;
  }

  export interface Flyout {
    new (workspaceOptions: unknown): void;
    autoClose: boolean;
    isVisible_: boolean;
    containerVisible_: boolean;
    CORNER_RADIUS: number;
    MARGIN: number;
    GAP_X: number;
    GAP_Y: number;
    SCROLLBAR_PADDING: number;
    width_: number;
    height_: number;
    contentWidth_: number;
    contentHeight_: number;
    verticalOffset_: number;
    dragAngleRange_: number;
    scrollAnimationFraction: number;
    recyclingEnabled_: number;
    createDom(tagName: string): Element;
    init(targetWorkspace: Blockly.Workspace): void;
    dispose(): void;
    setParentToolbox(toolbox: Toolbox): void;
    getParentToolbox(): Toolbox | null;
    getWidth(): number;
    getHeight(): number;
    getWorkspace(): WorkspaceSvg;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
    setContainerVisible(visible: boolean): void;
    updateDisplay_(): void;
    hide(): void;
    show(xmlList: unknown[] | string): void;
    emptyRecycleBlocks_(): void;
    recordCategoryScrollPositions_(): void;
    selectCategoryByScrollPosition(pos: number): void;
    stepScrollAnimation(): void;
    getScrollPos(): number;
    setScrollPos(pos: number): void;
    setRecyclingEnabled(recycle: boolean): void;
    clearOldBlocks_(): void;
    addBlockListeners_(root: Element, block: Blockly.Block, rect: Element): void;
    blockMouseDown_(block: Blockly.Block): UnKnownFunction;
    onMouseDown_(e: Event): void;
    createBlock(originalBlock: Blockly.BlockSvg): Blockly.BlockSvg;
    reflow(): void;
    isScrollable(): boolean;
    placeNewBlock_(oldBlock: Blockly.Block): Blockly.Block;
    recycleBlock_(block: Blockly.BlockSvg): void;
  }

  export interface Toolbox {
    HtmlDiv: HTMLElement;
    RTL: boolean;
    categoryMenu_: unknown;
    flyout_: VerticalFlyout;
  }

  export interface BlockSvg extends Block {
    insertionMarkerMinWidth_: number;
    height: number;
    width: number;
    dispose(a, b): void;
  }

  export interface VerticalFlyout {
    RTL: boolean;
    backgroundButtons_: Array<SVGRectElement>;
    buttons: Array<unknown>;
    categoryScrollPositions: Array<{
      categoryId: string;
      categoryName: string;
      length: number;
      position: number;
    }>;
    checkboxes_: Record<
      string,
      {
        block: Blockly.Block;
        clicked: boolean;
        disabled?: boolean;
      }
    >;
    clipRect_: SVGRectElement;
    defs_: SVGDefsElement;
    eventWrappers_: Array<[SVGElement, string, unknown]>;
    height_: number;
    horizontalLayout_: boolean;
    isVisible_: boolean;
    listeners_: Array<[SVGElement, string, unknown]>;
    parentToolbox_: Toolbox;
    permanentlyDisabled_: Array<unknown>;
    recycleBlocks_: Array<unknown>;
    recyclingEnabled_: boolean;
    reflowWrapper_: () => unknown;
    scrollTarget: null | EventTarget;
    getWorkspace: () => Workspace;
  }

  export class WorkspaceComment {
    new(
      workspace: Blockly.Workspace,
      content: string,
      height: number,
      width: number,
      minimized: boolean,
      opt_id?: string | undefined,
    ): void;
    MAX_LABEL_LENGTH: number;
    COMMENT_TEXT_LIMIT: number;
    dispose(): void;
    getHeight(): number;
    setHeight(height: number): void;
    getWidth(): number;
    setWidth(width: number): void;
    getHeightWidth(): {
      height: number;
      width: number;
    };
    getXY(): Coordinate;
    moveBy(dx: number, dy: number): void;
    isDeletable(): boolean;
    setDeletable(deletable: boolean): void;
    isMovable(): boolean;
    setMovable(movable: boolean): void;
    getText(): string;
    setText(text: string): void;
    isMinimized(): boolean;
    toXmlWithXY(opt_noId?: boolean | undefined): Element;
    getLabelText(): string;
    toXml(opt_noId?: boolean | undefined): Element;
    fireCreateEvent(comment: WorkspaceComment): void;
    fromXml(xmlComment: Element, workspace: Blockly.Workspace): WorkspaceComment;
    parseAttributes(xml: Element): unknown;
  }

  export class Comment extends Icon {
    createEditor_(): Element;
    dispose(): void;
    drawIcon_(group: Element): void;
    getBubbleSize(): { width: number; height: number };
    getText(): string;
    height_: number;
    resizeBubble_(): void;
    setBubbleSize(width: number, height: number): void;
    setText(text: string): void;
    setVisible(visible: boolean): void;
    text_: string;
    textareaFocus_(_e: Event): void;
    updateEditable(): void;
    width_: number;
  }

  export class Icon {
    SIZE: number;
    bubble_: null | Bubble;
    collapseHidden: boolean;
    computeIconLocation(): void;
    createIcon(): void;
    dispose(): void;
    getIconLocation(): Coordinate;
    iconClick_(e: Event): void;
    iconXY_: null | Coordinate;
    isVisible(): boolean;
    renderIcon(cursorX: number): number;
    setIconLocation(xy: Coordinate): void;
    updateEditable(): void;
    updateColour(): void;
  }

  export interface Bubble {
    BORDER_WIDTH: 6;
  }

  export interface Coordinate {
    x: number;
    y: number;
  }

  export class VariableModel {
    new(
      workspace: Blockly.Workspace,
      name: string,
      opt_type: string | null,
      opt_id?: string | undefined,
      opt_isLocal?: boolean | undefined,
      opt_isCloud?: boolean | undefined,
    ): void;
    getId(): string;
    compareByName(var1: VariableModel, var2: VariableModel): number;
  }

  export namespace Events {
    export interface Abstract {
      new (): void;
      toJson(): {
        type: unknown;
        group?: unknown;
      };
      fromJson(json: { type: unknown; group?: unknown }): void;
      isNull(): boolean;
      run(_forward: boolean): void;
      getEventWorkspace_(): Blockly.Workspace;
    }
  }

  export interface Options {
    new (options: unknown): void;
    parentWorkspace: Blockly.Workspace | null;
    setMetrics: unknown;
    getMetrics: unknown;
    parseZoomOptions_(options: unknown): unknown;
    parseGridOptions_(options: unknown): unknown;
    parseToolboxTree(tree: Node | string): Node;
  }

  export interface Trashcan {
    new (workspace: Blockly.Workspace): void;
    workspace: Blockly.Workspace;
    WIDTH_: number;
    BODY_HEIGHT_: number;
    LID_HEIGHT_: number;
    MARGIN_BOTTOM_: number;
    MARGIN_SIDE_: number;
    MARGIN_HOTSPOT_: number;
    SPRITE_LEFT_: number;
    SPRITE_TOP_: number;
    isOpen: boolean;
    svgGroup_: Element;
    svgLid_: Element;
    lidTask_: number;
    lidOpen_: number;
    left_: number;
    top_: number;
    createDom(): Element;
    init(bottom: number): number;
    dispose(): void;
    position(): void;
    getClientRect(): Rect;
    setOpen_(state: boolean): void;
    animateLid_(): void;
    close(): void;
    click(): void;
  }

  export interface FieldTextInput extends Field {
    argType_: Array<string>;
    arrowWidth_: number;
    class_?: string;
    name: string;
    renderSep: number;
    renderWidth: number;
    restrictor_?: unknown;
    size_: { width: number; height: number };
    sourceBlock_: Blockly.Block;
    textElement_: HTMLElement;
    text_: string;
    useTouchInteraction_: boolean;
    verify_when_blur_?: unknown;
    visible_: boolean;
    maxDisplayLength: number;
    workspace_: Blockly.WorkspaceSvg;
  }

  export interface Field {
    new (text: string, opt_validator?: UnKnownFunction | undefined): void;
    TYPE_MAP_: {
      [x: string]: {
        fromJson: UnKnownFunction;
      };
    };
    register(
      type: string,
      fieldClass: {
        fromJson: UnKnownFunction;
      },
    ): void;
    cacheWidths_: unknown;
    cacheReference_: number;
    name: string | undefined;
    className_: string;
    text_: string;
    sourceBlock_: Blockly.Block | null;
    visible_: boolean;
    argType_: unknown[];
    validator_: UnKnownFunction | null;
    NBSP: string;
    IE_TEXT_OFFSET: string;
    EDITABLE: boolean;
    SERIALIZABLE: boolean;
    setSourceBlock(block: Blockly.Block): void;
    init(): void;
    initModel(): void;
    dispose(): void;
    updateEditable(): void;
    isCurrentlyEditable(): boolean;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
    addArgType(argType: string): void;
    getArgTypes(): string;
    setValidator(handler: UnKnownFunction): void;
    getValidator(): UnKnownFunction;
    classValidator(text: string): string;
    callValidator(text: string): string | null;
    getSvgRoot(): Element;
    render_(): void;
    updateWidth(): void;
    getCachedWidth(textElement: Element): number;
    startCache(): void;
    stopCache(): void;
    getSize(): Size;
    getScaledBBox_(): {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    getDisplayText_(): string;
    getText(): string;
    setText(newText: string): void;
    forceRerender(): void;
    updateTextNode_(): void;
    getValue(): string;
    setValue(newValue: string): void;
    onMouseDown_(e: Event): void;
    setTooltip(_newTip: string | Element): void;
    getClickTarget_(): Element;
    getAbsoluteXY_(): Coordinate;
    referencesVariables(): boolean;
  }

  export interface ScrollbarPair {
    new (workspace: Blockly.Workspace): void;
    oldHostMetrics_: unknown;
    dispose(): void;
    resize(): void;
    set(x: number, y: number): void;
    getRatio_(handlePosition: number, viewSize: number): number;
    setContainerVisible(visible: boolean): void;
  }

  export interface Scrollbar {
    new (
      workspace: Blockly.Workspace,
      horizontal: boolean,
      opt_pair?: boolean | undefined,
      opt_class?: string | undefined,
    ): void;
    origin_: Coordinate;
    originHasChanged_: boolean;
    scrollViewSize_: number;
    handleLength_: number;
    handlePosition_: number;
    isVisible_: boolean;
    containerVisible_: boolean;
    scrollbarThickness: number;
    metricsAreEquivalent_(first: Metrics, second: Metrics): boolean;
    dispose(): void;
    setHandleLength_(newLength: number): void;
    setHandlePosition(newPosition: number): void;
    setScrollViewSize_(newSize: number): void;
    setPosition_(x: number, y: number): void;
    resize(opt_metrics?: Metrics): void;
    resizeHorizontal_(hostMetrics: Metrics): void;
    resizeViewHorizontal(hostMetrics: Metrics): void;
    resizeContentHorizontal(hostMetrics: Metrics): void;
    resizeVertical_(hostMetrics: Metrics): void;
    resizeViewVertical(hostMetrics: Metrics): void;
    resizeContentVertical(hostMetrics: Metrics): void;
    createDom_(opt_class?: string | undefined): void;
    isVisible(): boolean;
    setContainerVisible(visible: boolean): void;
    setVisible(visible: boolean): void;
    updateDisplay_(): void;
    onMouseDownBar_(e: Event): void;
    onMouseDownHandle_(e: Event): void;
    onMouseMoveHandle_(e: Event): void;
    onMouseUpHandle_(): void;
    cleanUp_(): void;
    constrainHandle_(value: number): number;
    onScroll_(): void;
    set(value: number): void;
    setOrigin(x: number, y: number): void;
  }

  export interface Gesture {
    new (e: Event, creatorWorkspace: Blockly.WorkspaceSvg): void;
    dispose(): void;
    updateFromEvent_(e: Event): void;
    updateDragDelta_(currentXY: Coordinate): boolean;
    updateIsDraggingFromFlyout_(): boolean;
    updateIsDraggingBubble_(): boolean;
    updateIsDraggingBlock_(): boolean;
    updateIsDraggingWorkspace_(): void;
    updateIsDragging_(): void;
    startDraggingBlock_(): void;
    startDraggingBubble_(): void;
    doStart(e: Event): void;
    bindMouseEvents(e: Event): void;
    handleMove(e: Event): void;
    handleUp(e: Event): void;
    cancel(): void;
    handleRightClick(e: Event): void;
    handleWsStart(e: Event, ws: Blockly.Workspace): void;
    handleFlyoutStart(e: Event, flyout: Blockly.Flyout): void;
    handleBlockStart(e: Event, block: Blockly.BlockSvg): void;
    handleBubbleStart(e: Event, bubble: Blockly.Bubble): void;
    doBubbleClick_(): void;
    doFieldClick_(): void;
    doBlockClick_(): void;
    doWorkspaceClick_(): void;
    bringBlockToFront_(): void;
    setStartField(field: Blockly.Field): void;
    setStartBubble(bubble: Blockly.Bubble): void;
    setStartBlock(block: Blockly.BlockSvg): void;
    setTargetBlock_(block: Blockly.BlockSvg): void;
    setStartWorkspace_(ws: Blockly.WorkspaceSvg): void;
    setStartFlyout_(flyout: Blockly.Flyout): void;
    isBubbleClick_(): boolean;
    isBlockClick_(): boolean;
    isFieldClick_(): boolean;
    isWorkspaceClick_(): boolean;
    isDragging(): boolean;
    hasStarted(): boolean;
    forceStartBlockDrag(fakeEvent: unknown, block: Blockly.BlockSvg): void;
    duplicateOnDrag_(): void;
  }

  export interface BlockDragSurfaceSvg {
    new (container: Element): void;
    SVG_: Element | null;
    dragGroup_: Element | null;
    container: Element | null;
    scale_: number;
    surfaceXY_: Coordinate;
    dragShadowFilterId_: string;
    SHADOW_STD_DEVIATION: number;
    createDom(): void;
    createDropShadowDom_(defs: Element): string;
    setBlocksAndShow(blocks: Element): void;
    translateAndScaleGroup(x: number, y: number, scale: number): void;
    translateSurfaceInternal_(): void;
    translateSurface(x: number, y: number): void;
    getSurfaceTranslation(): Coordinate;
    getGroup(): Element;
    getCurrentBlock(): Element | undefined;
    clearAndHide(opt_newSurface?: Element | undefined): void;
  }

  export interface WorkspaceDragSurfaceSvg {
    new (container: Element): void;
    SVG_: Element | null;
    dragGroup_: Element | null;
    container: Element | null;
    createDom(): void;
    translateSurface(x: number, y: number): void;
    getSurfaceTranslation(): Coordinate;
    clearAndHide(newSurface: SVGElement): void;
    setContentsAndShow(
      blockCanvas: Element,
      bubbleCanvas: Element,
      previousSibling: Element | null,
      width: number,
      height: number,
      scale: number,
    ): void;
  }

  export interface FlyoutButton {
    new (workspace: Blockly.WorkspaceSvg, targetWorkspace: Blockly.WorkspaceSvg, xml: Element, isLabel: boolean): void;
    MARGIN: number;
    width: number;
    height: number;
    onMouseUpWrapper_: null | unknown;
    init(workspace: Blockly.WorkspaceSvg, targetWorkspace: Blockly.WorkspaceSvg, xml: Element, isLabel: boolean): void;
    createDom(): Element;
    addTextSvg(isLabel: boolean): void;
    show(): void;
    updateTransform_(): void;
    moveTo(x: number, y: number): void;
    getTargetWorkspace(): Blockly.WorkspaceSvg;
    getIsCategoryLabel(): boolean;
    getText(): string;
    getPosition(): Coordinate;
    dispose(): void;
    onMouseUp_(e: Event): void;
  }

  export interface Grid {
    new (pattern: SVGElement, options: unknown): void;
    scale_: number;
    dispose(): void;
    shouldSnap(): boolean;
    getSpacing(): number;
    getPatternId(): string;
    update(scale: number): void;
    setLineAttributes_(line: SVGElement, width: number, x1: number, x2: number, y1: number, y2: number): void;
    moveTo(x: number, y: number): void;
    createDom(rnd: string, gridOptions: unknown, defs: SVGElement): SVGElement;
  }

  export interface WorkspaceAudio {
    new (parentWorkspace: Blockly.WorkspaceSvg): void;
    lastSound_: Date | null;
    dispose(): void;
    load(filenames: Array<string>, name: string): void;
    preload(): void;
    play(name: string, opt_volume?: number | undefined): void;
  }

  export interface VariableMap {
    new (workspace: Blockly.Workspace): void;
    clear(): void;
    renameVariable(variable: Blockly.VariableModel, newName: string, not_fire_event: boolean): void;
    renameVariableById(id: string, newName: string, not_fire_event: boolean): void;
    renameVariableAndUses_(
      variable: Blockly.VariableModel,
      newName: string,
      blocks: Array<Blockly.Block>,
      not_fire_event: boolean,
    ): void;
    renameVariableWithConflict_(
      variable: Blockly.VariableModel,
      newName: string,
      conflictVar: Blockly.VariableModel,
      blocks: Array<Blockly.Block>,
    ): void;
    createVariable(
      name: string,
      opt_type: string | null,
      opt_id?: string | undefined,
      opt_isLocal?: boolean | undefined,
      opt_isCloud?: boolean | undefined,
    ): Blockly.VariableModel | null;
    deleteVariable(variable: Blockly.VariableModel, not_fire_event: boolean): void;
    deleteVariableById(id: string): void;
    forceDeleteVariableById(id: string): void;
    deleteVariableInternal_(variable: Blockly.VariableModel, uses: Array<Blockly.Block>, not_fire_event: boolean): void;
    getVariable(name: string, opt_type?: string | undefined): Blockly.VariableModel;
    getVariableById(id: string): Blockly.VariableModel | null;
    getVariablesOfType(type: string | null): Array<Blockly.VariableModel>;
    getVariableTypes(): Array<string>;
    getAllVariables(): Array<Blockly.VariableModel>;
    getVariableUsesById(id: string): Array<Blockly.Block>;
  }

  export interface Size {
    new (width: number, height: number): void;
    width: number;
    height: number;
  }

  export interface Rect {
    new (x: number, y: number, w: number, h: number): void;
    height: number;
    left: number;
    top: number;
    width: number;
  }
}
