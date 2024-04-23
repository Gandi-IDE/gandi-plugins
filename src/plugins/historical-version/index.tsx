import * as React from "react";
import HistoricalVersionIcon from "assets/icon--statistics.svg";

const HistoricalVersion: React.FC<PluginContext> = ({ redux, msg, registerSettings }) => {
  React.useEffect(() => {
    redux.dispatch({
      type: "scratch-gui/global-settings/SET_HISTORICAL_VERSION_USEABLE",
      visible: true,
    });
    const register = registerSettings(
      msg("plugins.historicalVersion.title"),
      "plugin-historical-version",
      [
        {
          key: "local",
          label: msg("plugins.historicalVersion.title"),
          items: [
            {
              key: "autoSaveable",
              type: "switch",
              label: msg("plugins.historicalVersion.autoSaveable"),
              value: true,
              onChange: (value) => {
                redux.dispatch({
                  type: "scratch-gui/global-settings/SET_HISTORICAL_VERSION_AUTO_SAVEABLE",
                  value,
                });
              },
            },
            {
              key: "maximum",
              type: "input",
              inputProps: {
                type: "number",
              },
              label: msg("plugins.historicalVersion.maximum"),
              value: 100,
              onChange: (value) => {
                redux.dispatch({
                  type: "scratch-gui/global-settings/SET_HISTORICAL_VERSION_AUTO_SAVEABLE_MAXIMUM",
                  value: Number.isNaN(Number(value)) ? 0 : Number(value),
                });
              },
            },
            {
              key: "interval",
              type: "select",
              label: msg("plugins.historicalVersion.interval"),
              value: 5 * 60 * 1000,
              options: [
                { label: `5 ${msg("plugins.historicalVersion.mins")}`, value: 5 * 60 * 1000 },
                { label: `10 ${msg("plugins.historicalVersion.mins")}`, value: 10 * 60 * 1000 },
                { label: `30 ${msg("plugins.historicalVersion.mins")}`, value: 30 * 60 * 1000 },
                { label: `60 ${msg("plugins.historicalVersion.mins")}`, value: 60 * 60 * 1000 },
              ],
              onChange: (value) => {
                redux.dispatch({
                  type: "scratch-gui/global-settings/SET_HISTORICAL_VERSION_AUTO_SAVEABLE_INTERVAL_SECS",
                  value,
                });
              },
            },
          ],
        },
      ],
      <HistoricalVersionIcon />,
    );
    return () => {
      redux.dispatch({
        type: "scratch-gui/global-settings/SET_HISTORICAL_VERSION_USEABLE",
        visible: false,
      });
      register.dispose();
    };
  }, [registerSettings, msg]);

  return null;
};

HistoricalVersion.displayName = "HistoricalVersion";

export default HistoricalVersion;
