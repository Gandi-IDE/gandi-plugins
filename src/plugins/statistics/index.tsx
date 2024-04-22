import * as React from "react";
import StatisticsIcon from "assets/icon--statistics.svg";

const Statistics: React.FC<PluginContext> = ({ redux, msg, registerSettings }) => {
  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.statistics.title"),
      "plugin-statistics",
      [
        {
          key: "enabledFunctions",
          label: msg("plugins.statistics.title"),
          description: msg("plugins.statistics.description"),
          items: [
            {
              key: "dropdown",
              label: msg("plugins.statistics.option.countCodeNum"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                redux.dispatch({
                  type: "scratch-gui/settings/SWITCH_STATISTICS_CODE_COUNT",
                  open: value,
                });
              },
            },
            {
              key: "input",
              label: msg("plugins.statistics.option.projectSize"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                redux.dispatch({
                  type: "scratch-gui/settings/SWITCH_STATISTICS_BYTE_SIZE",
                  open: value,
                });
              },
            },
          ],
        },
      ],
      <StatisticsIcon />,
    );
    return () => {
      register.dispose();
    };
  }, [redux, registerSettings, msg]);

  return null;
};

Statistics.displayName = "Statistics";

export default Statistics;
