declare module "*.less" {
  const classes: { [className: string]: string };
  export default classes;
}

declare module "*.svg" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "*.svg?url" {
  const src: string;
  export default src;
}

interface Window {
  $monitoringVariable?: boolean;
  Blockly: {
    Xml: {
      frameToDom(frame: Blockly.Frame, createBlocksXml?: boolean): Element;
      clearWorkspaceAndLoadFromXml(xml: Element, workspace: Blockly.Workspace): Array<string>;
      domToBlock(dom: Element, workspace: Blockly.Workspace): Blockly.Block;
      domToText(dom: Element): string;
      blockToDom(
        block: Blockly.Block,
        opt_noId?: boolean | undefined,
        endBlockId?: string | undefined,
        withoutComment?: boolean | undefined,
      ): Element;
      domToWorkspace(xml: Element, workspace: Blockly.Workspace): Array<string>;
      textToDom(text: string): Element;
      workspaceToDom(workspace: Blockly.Workspace, opt_noId?: boolean | undefined): Element;
    };
    ContextMenu: {
      show(e: Event, options: Array<unknown>, rtl: boolean): void;
      hide(): void;
      addDynamicMenuItem(
        callback: (
          items: Array<Record<string, unknown>>,
          target: Record<string, unknown> | null,
          event: MouseEvent,
        ) => void,
        config: {
          targetNames: Array<"workspace" | "blocks" | "frame" | "comment">;
        },
      ): string;
      deleteDynamicMenuItem(id: string): void;
      clearDynamicMenuItems(): void;
    };
    Events: {
      disable(): void;
      enable(): void;
      getGroup(): string;
      setGroup(state: boolean | string): void;
    };
    Utils: {
      genUid: () => string;
      tokenizeInterpolation: (message: string) => string[];
      getMouseVectorPosition(
        event: { clientX: number; clientY: number },
        workspace: Blockly.Workspace,
      ): { x: number; y: number };
      getBlockSvgImage(
        block: Blockly.Block,
        blockId?: string,
      ): {
        url: string;
        height: number;
        width: number;
      };
      getBlockDesc(
        block: Blockly.Block,
        doms: Record<string, HTMLElement>,
      ): {
        desc: string;
        block: Blockly.Block;
        dom: HTMLElement;
      };
    };
    getMainWorkspace(): Blockly.Workspace;
  };
  Scratch?: {
    plugins?: {
      register?: (
        pluginFunction: (context: PluginContext) => {
          dispose?(): void;
        },
        pluginName?: string,
      ) => void;
    };
  };
}

declare module "gandiblocks";

interface RuntimeBlocksData {
  fields: {
    [key: string]: {
      id?: string | null;
      name: string;
      value: string;
      variableType?: string;
    };
  };
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
}

declare interface VirtualMachine extends NodeJS.EventEmitter {
  runtime: {
    storage: any;
    threads: Array<Scratch.Thread>;
    monitorBlocks: Scratch.Blocks;
    targets: Array<Scratch.RenderTarget>;
    allAssetsIsUploading?: boolean;
    logSystem: {
      log(message?: unknown, ...optionalParams: unknown[]): void;
      info(message?: unknown, ...optionalParams: unknown[]): void;
      warn(message?: unknown, ...optionalParams: unknown[]): void;
      error(message?: unknown, ...optionalParams: unknown[]): void;
      clear(): void;
      show(): void;
      hide(): void;
      setColor(color: string): void;
    };
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
  };
  editingTarget: Scratch.RenderTarget;
  assets: Scratch.Asset[];
  addCostumeFromLibrary: any;
  addCostume: any;
  toJSON: () => string;
  setEditingTarget: (targetId: string) => void;
  saveProjectSb3: () => Promise<Blob>;
  saveProjectSb3DontZip: () => Record<string, Uint8Array>;
}
