import CustomCssIcon from "assets/icon--custom-css.svg";
import React from "react";

import presetThemes from "./presetThemes.less";

const CustomCss = ({ registerSettings, msg }: PluginContext) => {
  const linkDom = document.createElement("link");
  linkDom.type = "text/css";
  linkDom.rel = "stylesheet";
  linkDom.id = "custom-css";
  document.getElementsByTagName("head")[0].appendChild(linkDom);

  const removeAllStyles = () => {
    document.body.classList.remove(presetThemes.turbowarpDark)
  }
  const register = registerSettings(
    msg("plugins.customCss.title"),
    "custom-css",
    [
      {
        key: "custom-css",
        label: msg("plugins.customCss.name"),
        description: msg("plugins.customCss.description"),
        items: [
          {
            key: 'presetThemes',
            type: 'select',
            label: msg('plugins.customCss.theme'),
            value: "noPreset",
            options: [
              { label: msg('plugins.customCss.theme.none'), value: "noPreset" },
              { label: msg('plugins.customCss.theme.turbowarpDark'), value: "turbowarpDark" },
            ],
            onChange: (value) => {
              switch(value) {
                default:
                  removeAllStyles()
                  break;
                case "turbowarpDark":
                  removeAllStyles()
                  document.body.classList.add(presetThemes.turbowarpDark)
                  break;
              }
            },
          },
          {
            key: "load-from-url",
            label: msg("plugins.customCss.load"),
            type: "input",
            value: "https://m.ccw.site/gandi/default.css",
            description: msg("plugins.customCss.load.description"),
            onChange: (value: string) => {
              if (value.startsWith("http")) {
                linkDom.href = value;
              }
            },
          },
        ],
      },
    ],
    React.createElement(CustomCssIcon),
  );
  return {
    dispose: () => {
      /** Remove some side effects */
      register.dispose();
    },
  };
};

export default CustomCss;
