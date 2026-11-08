import type { PluginFunction } from "src/plugins-controller";
import easyuiRuntime from "./easyui-runtime.asset";

interface EasyUIInstance {
  dispose?: () => void;
  openDashboard?: () => void;
  closeDashboard?: () => void;
}

interface EasyUIScratch {
  extensions?: {
    unsandboxed?: boolean;
    register?: (instance: unknown) => void;
  };
}

type EasyUIGlobal = typeof globalThis & {
  Scratch?: EasyUIScratch;
  EasyUIExtension?: new (options: { Scratch: EasyUIScratch }) => EasyUIInstance;
  EasyUIInstance?: EasyUIInstance;
  __EASYUI_PLUGIN_MODE__?: boolean;
};

const globalScope = globalThis as EasyUIGlobal;
let instance: EasyUIInstance | null = globalScope.EasyUIInstance ?? null;

/**
 * Gandi 插件入口：把 EasyUI 作为非沙箱 Scratch 扩展注册进编辑器。
 * 关闭插件时保留积木注册，只关闭仪表盘，避免作品中的积木失效。
 */
const EasyUI: PluginFunction = () => {
  const scratch = globalScope.Scratch;
  const extensions = scratch?.extensions;

  if (!scratch || !extensions || typeof extensions.register !== "function") {
    console.error("[EasyUI] 未找到 Scratch.extensions.register，无法注册扩展。请确认当前运行在 Gandi IDE 编辑器中。");
    return { dispose: () => undefined };
  }

  if (!instance) {
    const previousUnsandboxed = extensions.unsandboxed;
    extensions.unsandboxed = true;
    globalScope.__EASYUI_PLUGIN_MODE__ = true;
    try {
      // EasyUI 以单文件 IIFE 形式内嵌，这里在插件作用域中执行并取得扩展类。
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function("Scratch", easyuiRuntime)(scratch);
      const ExtensionClass = globalScope.EasyUIExtension;
      if (!ExtensionClass) throw new Error("EasyUI 运行时未导出 EasyUIExtension");

      const nextInstance = new ExtensionClass({ Scratch: scratch });
      extensions.register(nextInstance);
      instance = nextInstance;
      globalScope.EasyUIInstance = nextInstance;
    } catch (error) {
      instance = null;
      console.error("[EasyUI] 扩展注册失败", error);
    } finally {
      globalScope.__EASYUI_PLUGIN_MODE__ = false;
      extensions.unsandboxed = previousUnsandboxed;
    }
  }

  const current = instance;
  return {
    dispose: () => {
      current?.closeDashboard?.();
    },
  };
};

export default EasyUI;
