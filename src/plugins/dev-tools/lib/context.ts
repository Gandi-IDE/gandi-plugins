import { createContext, useContext } from "react";

export const DevToolsContext = createContext<PluginContext>(null);

export const useDevToolsContext = () => useContext(DevToolsContext);
