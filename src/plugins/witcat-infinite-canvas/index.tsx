import * as React from "react";
import Icon from "./icon";

declare const window: Window & {
  scratchPaintInfiniteCanvas: boolean;
};

const WitcatInfiniteCanvas: React.FC<PluginContext> = ({ registerSettings, msg }) => {
  console.log("witcat");
  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.witcatInfiniteCanvas.title"),
      "witcat-infinite-canvas",
      [
        {
          key: "settings",
          label: msg("plugins.witcatInfiniteCanvas.title"),
          items: [
            {
              key: "open",
              type: "switch",
              label: "启用无限画布",
              value: false,
              onChange(v: boolean) {
                console.log(v);
                window.scratchPaintInfiniteCanvas = v;
              },
            },
          ],
        },
      ],
      <Icon></Icon>,
    );
    return () => {
      window.scratchPaintInfiniteCanvas = false;
      register.dispose();
    };
  }, [registerSettings, msg]);

  return null;
};

WitcatInfiniteCanvas.displayName = "WitcatInfiniteCanvas";

export default WitcatInfiniteCanvas;
