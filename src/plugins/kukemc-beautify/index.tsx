import * as React from "react";
import KukemcBeautifyIcon from "assets/icon--kukemcbeautify.svg";
import styles from "./styles.less";

const KukemcBeautify: React.FC<PluginContext> = ({ msg, registerSettings }) => {
  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.kukemcBeautify.title"),
      "plugin-kukemc-beautify",
      [
        {
          key: "kukemcBeautify",
          label: msg("plugins.kukemcBeautify.title"),
          description: msg("plugins.kukemcBeautify.description"),
          items: [
            {
              key: "Ground",
              label: msg("plugins.kukemcBeautify.frostedGlass"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                if (value) {
                  document.body.classList.add(styles.frostedGlass);
                } else {
                  document.body.classList.remove(styles.frostedGlass);
                }
              },
            },
            {
              key: "transparent",
              label: msg("plugins.kukemcBeautify.transparency"),
              type: "input",
              inputProps: {
                type: "number",
              },
              value: 0.29,
              onChange: (value: string) => {
                document.body.style.setProperty("--alpha", value);
              },
            },
            {
              key: "ambiguity",
              label: msg("plugins.kukemcBeautify.ambiguity"),
              type: "input",
              inputProps: {
                type: "number",
              },
              value: 10,
              onChange: (value: string) => {
                document.body.style.setProperty("--radius", (Number(value) || 0) + "px");
              },
            },
          ],
        },
      ],
      <KukemcBeautifyIcon />,
    );
    return () => {
      register.dispose();
    };
  }, [registerSettings, msg]);

  return null;
};

KukemcBeautify.displayName = "KukemcBeautify";

export default KukemcBeautify;
