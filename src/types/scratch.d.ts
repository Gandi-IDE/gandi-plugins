type L10n = "en" | "zh-cn" | string;

interface LogSystem {
  log(message?: unknown, ...optionalParams: unknown[]): void;
  info(message?: unknown, ...optionalParams: unknown[]): void;
  warn(message?: unknown, ...optionalParams: unknown[]): void;
  error(message?: unknown, ...optionalParams: unknown[]): void;
  clear(): void;
  show(): void;
  hide(): void;
  setColor(color: string): void;
}

interface Extension {
  info: {
    name: string;
    extensionId: string;
    collaborator?: string;
    connectingMessage?: string;
    connectionIconURL?: string;
    connectionSmallIconURL?: string;
    collaboratorList?: Array<{
      collaborator: string;
      collaboratorURL?: string;
    }>;
    collaboratorURL?: string;
    disabled?: boolean;
    doc?: string;
    featured: boolean;
    iconURL?: string;
    insetIconURL?: string;
  };
  l10n?: {
    [key in L10n]: Record<string, string>;
  };
}

interface ExtensionBlockMetadata {
  json: Record<string, unknown>;
  xml: string;
}

declare namespace Scratch {
  export type RenderTarget = {
    originalTargetId: string;
    blocks: Blocks;
    comments: Record<string, Comment>;
    currentCostume: number;
    direction: number;
    draggable: boolean;
    dragging: boolean;
    drawableID: number;
    editor?: string;
    effects: {
      brightness: number;
      color: number;
      fisheye: number;
      ghost: number;
      mosaic: number;
      pixelate: number;
      whirl: number;
    };
    id: string;
    interpolationData: null;
    isModule: boolean;
    isOriginal: boolean;
    isStage: boolean;
    locked?: boolean;
    renderer?: any;
    sprite: Sprite;
    tempo: number;
    textToSpeechLanguage: null;
    variables: Record<string, Variable>;
    videoState: string;
    videoTransparency: number;
    volume: number;
    size: number;
    visible: boolean;
    x: number;
    y: number;
    createVariable(id: string, name: string, type: string, isCloud?: boolean): void;
    deleteVariable(id: string, isRemoteOperation?: boolean): void;
    getCostumes(): Array<Costume>;
    getCostumeById(id: string): Scratch.Costume;
  };

  export type BlockState = {
    fields: {
      [key: string]: {
        id?: string | null;
        name: string;
        value: string;
        variableType?: string;
      };
    };
    id: string;
    inputs: {
      [key: string]: {
        block: string | null;
        name: string;
        shadow: string;
      };
    };
    next: string | null;
    opcode: string;
    parent: string | null;
    shadow: boolean;
    topLevel: boolean;
    x?: number;
    y?: number;
    mutation?: {
      argumentdefaults?: string;
      argumentids?: string;
      argumentnames?: string;
      children: unknown[];
      hasnext?: string;
      isglobal?: string;
      isreporter?: string;
      proccode?: string;
      tagName: string;
      targetid?: string;
      type?: string;
      warp?: string;
      blockInfo?: {
        arguments?: Record<
          string,
          {
            type: string;
            defaultValue: string;
          }
        >;
        blockType?: string;
        isDynamic?: boolean;
        text: string;
        opcode: string;
      };
    };
  };

  export type Blocks = {
    forceNoGlow: boolean;
    runtime: Runtime;
    getBlock: (blockId: string) => BlockState;
    _blocks: {
      [id: string]: BlockState;
    };
    _scripts: Array<string>;
  };

  export type Comment = {
    blockId: string | null;
    id: string;
    text: string;
    minimized: boolean;
    width: number;
    height: number;
    x: number;
    y: number;
  };

  export type Sprite = {
    blocks: Blocks;
    clones: Array<RenderTarget>;
    costumes_: Array<Costume>;
    name: string;
    runtime: Runtime;
    soundBank: SoundBank;
    sounds: Array<Sound>;
    y: number;
    createClone: (optLayerGroup: string) => RenderTarget;
    removeClone: (clone: RenderTarget) => void;
  };

  export type Asset = {
    assetId: string;
    assetType: {
      contentType: string;
      immutable: boolean;
      name: string;
      runtimeFormat: string;
    };
    data: Uint8Array;
    dataFormat: string;
    dependencies: unknown[];
    externalSource: boolean;
    _clean: boolean;
  };

  export type Costume = {
    id: string;
    asset: Asset;
    assetId: string;
    bitmapResolution: number;
    dataFormat: string;
    md5: string;
    name: string;
    rotationCenterX: number;
    rotationCenterY: number;
    size: [number, number];
    skinId: number;
  };

  export type Sound = {
    asset: Asset;
    assetId: string;
    dataFormat: string;
    format: string;
    md5: string;
    name: string;
    rate: number;
    sampleCount: number;
    soundId: string;
  };

  export type Variable = {
    // eslint-disable-next-line @typescript-eslint/no-misused-new
    constructor(id: string, name: string, type: string, isCloud: boolean, targetId: string): void;
    id: string;
    isCloud: boolean;
    name: string;
    type: string;
    value: string | Array<string | boolean | number>;
    targetId: string;
    _monitorUpToDate: boolean;
    _name: string;
    _value: string | Array<string | boolean | number>;
  };

  export interface SoundBank {
    audioEngine: unknown;
    effectChainPrime: unknown;
    playerTargets: unknown;
    soundEffects: unknown;
    soundPlayers: unknown;
  }

  export interface Runtime extends NodeJS.EventEmitter {
    addCloudVariable: () => void;
    addonBlocks: Record<
      string,
      {
        procedureCode: string;
        callback: (...args: unknown[]) => unknown;
        arguments: string[];
        color: string;
        secondaryColor: string;
      }
    >;

    audioEngine: unknown;
    canAddCloudVariable: () => boolean;
    ccwAPI: unknown;
    cloudOptions: {
      limit: number;
    };
    compilerOptions: {
      enabled: boolean;
      warpTimer: boolean;
    };
    currentMSecs: number;
    currentStepTime: number;
    debug: boolean;
    framerate: number;
    gandi: {
      assets: Array<unknown>;
      configs: Record<string, unknown>;
      dynamicMenuItems: Record<string, unknown>;
      runtime: Runtime;
      spine: Record<
        string,
        {
          atlas: string;
          json: string;
        }
      >;
      wildExtensions: Record<
        string,
        {
          id: string;
          url: string;
        }
      >;
      _supportedAssetTypes: Array<{
        contentType: string;
        immutable: boolean;
        name: string;
        runtimeFormat: string;
      }>;
    };
    greenFlag(): void;
    hasCloudData(): boolean;
    interpolationEnabled: boolean;
    ioDevices: unknown;
    isLoadProjectAssetsNonBlocking: boolean;
    logSystem: LogSystem;
    storage: any;
    threads: Array<Scratch.Thread>;
    monitorBlocks: Scratch.Blocks;
    targets: Array<Scratch.RenderTarget>;
    allAssetsIsUploading?: boolean;
    getTargetById: (targetId: string) => Scratch.RenderTarget;
    requestAddMonitor(monitorId: string, isRemoteOperation?: boolean): void;
    requestUpdateMonitor: (monitor: Map<unknown, unknown>) => boolean;
    requestRemoveMonitor(monitorId: string, isRemoteOperation?: boolean): boolean;
    _pushMonitors: () => void;
    _pushThread: (
      id: string,
      target: Scratch.RenderTarget,
      object?: {
        stackClick?: boolean;
        updateMonitor?: boolean;
        hatParam?: unknown;
      },
    ) => void;
  }

  export type Thread = {
    topBlock: string;
    status: number;
    updateMonitor: boolean;
  };

  export interface ExtensionManager {
    asyncExtensionsLoadedCallbacks: Array<(...args: unknown[]) => unknown>;
    loadingAsyncExtensions: number;
    nextExtensionWorker: number;
    pendingExtensions: Array<{
      extensionURL: string;
      resolve: (...args: unknown[]) => void;
      reject: (...args: unknown[]) => void;
    }>;
    pendingWorkers: Array<{
      extensionURL: string;
      resolve: (...args: unknown[]) => void;
      reject: (...args: unknown[]) => void;
    }>;
    runtime: Runtime;
    showCompatibilityWarning: boolean;
    vm: VirtualMachine;
    workerMode: string;
    _customExtensionInfo: Record<string, Extension>;
    _loadedExtensions: Map<string, string>;
    _officialExtensionInfo: Record<string, Extension>;
    addCustomExtensionInfo(obj: unknown, url: string): void;
    addOfficialExtensionInfo(obj: unknown): void;
    allAsyncExtensionsLoaded(): Promise<unknown>;
    allocateWorker(): [number, string];
    clearLoadedExtensions(): void;
    createExtensionWorker(): Promise<unknown>;
    deleteExtensionById(extensionId: string): void;
    disposeExtensionServices(): void;
    getExtensionInfoById(extensionId: string): Extension | undefined;
    getExternalExtensionConstructor(extensionId: string): Promise<unknown>;
    getLoadedExtensionURLs(): Array<Record<string, string>>;
    getReplaceableExtensionInfo(): Extension[];
    injectExtension(extensionId: string, extension: Extension): void;
    isBuiltinExtension(extensionId: string): boolean;
    isExtensionIdReserved(extensionId: string): boolean;
    isExtensionLoaded(extensionID: string): boolean;
    isExternalExtension(extensionId: string): boolean;
    isValidExtensionURL(extensionURL: string): boolean;
    loadExtensionIdSync(extensionId: string): string;
    loadExtensionURL(extensionURL: string, shouldReplace?: boolean): Promise<unknown>;
    loadExtensionURLInWorker(extensionURL: string): Promise<unknown>;
    loadExternalExtensionById(extensionId: string, shouldReplace?: boolean): Promise<unknown> | undefined;
    loadExternalExtensionToLibrary(
      url: string,
      shouldReplace?: boolean | undefined,
      disallowIIFERegister?: boolean | undefined,
    ): Promise<{
      onlyAdded: string[];
      addedAndLoaded: string[];
    }>;
    onWorkerInit(id: string, e: unknown): void;
    refreshBlocks(targetServiceName: string): Promise<string>;
    registerExtension(extensionId: string, extension: Extension, shouldReplace?: boolean): string | undefined;
    registerExtensionService(serviceName: string): void;
    registerExtensionServiceSync(serviceName: string): void;
    replaceExtensionWithId(newId: string, oldId: string): void;
    saveWildExtensionsURL(id: string, url: string): void;
    setLoadedExtension(extensionId: string, value: Extension): void;
    updateExternalExtensionConstructor(extensionId: string, func: unknown): void;
    _getExtensionMenuItems(extensionObject: object, menuItemFunctionName: string): unknown[];
    _prepareBlockInfo(serviceName: string, blockInfo: ExtensionBlockMetadata): ExtensionBlockMetadata;
    _prepareExtensionInfo(serviceName: string, extensionInfo: unknown): unknown;
    _prepareMenuInfo(serviceName: string, menus: Array<unknown>): Array<unknown>;
    _registerExtensionInfo(serviceName: string, extensionInfo: unknown): void;
    _registerInternalExtension(extensionObject: unknown): string;
    _sanitizeID(text: string): string;
  }
}
