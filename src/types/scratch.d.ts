/// <reference path="../../node_modules/gandi-types/types/scratch-storage.d.ts" />

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

declare namespace Gandi {
  export type FrameState = {
    blocks: string[];
    collapsed: boolean;
    color: string;
    height: number;
    id: string;
    locked: boolean;
    title: string;
    width: number;
    x: number;
    y: number;
  };

  export type Frames = {
    runtime: Runtime;
    createFrame(e: FrameState): boolean;
    deleteFrame(id: string): boolean;
    toXML(id: string): string;
  };

  export type Sprite = VM.Sprite & {
    frames: Frames;
    createClone: (optLayerGroup: string) => VM.Target;
    removeClone: (clone: VM.Target) => void;
  };

  export interface SoundBank {
    audioEngine: unknown;
    effectChainPrime: unknown;
    playerTargets: unknown;
    soundEffects: unknown;
    soundPlayers: unknown;
  }

  export interface Asset extends ScratchStorage.Asset {
    data: Uint8Array;
  }

  export interface BaseAsset extends VM.BaseAsset {
    asset: Asset | null;
  }

  export interface Costume extends VM.Costume {
    asset: Asset | null;
  }

  export interface Target extends VM.Target {
    sprite: Sprite;
    locked?: boolean;
    getCostumeById(id: string): Costume;
    getCostumes(): Costume[];
    deleteVariable(id: string, isRemoteOperation?: boolean): void;
  }

  export interface Runtime extends VM.Runtime {
    targets: Target[];
    ccwAPI: unknown; // TODO: implement ccwAPI
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
    isLoadProjectAssetsNonBlocking: boolean;
    logSystem: LogSystem;
    allAssetsIsUploading?: boolean;
  }

  export interface ExtensionManager extends VM.ExtensionManager {
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
    loadExtensionURL(extensionURL: string, shouldReplace?: boolean): Promise<number>;
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
    refreshBlocks(targetServiceName?: string): Promise<void[]>;
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
