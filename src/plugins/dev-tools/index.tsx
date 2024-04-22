import * as React from "react";
import DevToolsPluginEntrance from "./components/Entrance";
import DevToolsPluginContent from "./components/Content";
import { DevToolsContext } from "./lib/context";

const DevTools: React.FC<PluginContext> = (props) => {
  return (
    <DevToolsContext.Provider value={props}>
      <DevToolsPluginEntrance>
        <DevToolsPluginContent />
      </DevToolsPluginEntrance>
    </DevToolsContext.Provider>
  );
};

DevTools.displayName = "DevToolsPlugin";

export default DevTools;
