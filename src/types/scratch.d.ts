declare namespace Scratch {
  export type RenderTarget = {
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
    renderer?: unknown;
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

  export type Runtime = {
    addCloudVariable: () => void;
    pluginBlocks: () => void;
  };

  export type Thread = {
    topBlock: string;
    status: number;
    updateMonitor: boolean;
  };
}
