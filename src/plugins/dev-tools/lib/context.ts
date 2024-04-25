import { createContext, useContext } from "react";

export const DevToolsContext = createContext<PluginContext>({
  vm: null,
  intl: null,
  workspace: null,
  registerSettings: null,
  trackEvents: null,
  blockly: null,
  msg: null,
  utils: null,
  redux: null,
  injectPlugin: null,
});

export const useDevToolsContext = () => useContext(DevToolsContext);
