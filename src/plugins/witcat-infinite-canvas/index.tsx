import * as React from "react";
import Icon from "./icon";

declare const window: Window & {
  scratchPaintInfiniteCanvas: boolean;
};

const WitcatInfiniteCanvas: React.FC<PluginContext> = ({ registerSettings, msg }) => {
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
              label: msg("plugins.witcatInfiniteCanvas.open"),
              value: false,
              onChange(v: boolean) {
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
