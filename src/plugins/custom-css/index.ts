import CustomCssIcon from "assets/icon--custom-css.svg";
import React from "react";
const CustomCss = ({ registerSettings, msg }: PluginContext) => {
  const linkDom = document.createElement("link");
  linkDom.type = "text/css";
  linkDom.rel = "stylesheet";
  linkDom.id = "custom-css";
  document.getElementsByTagName("head")[0].appendChild(linkDom);
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
            key: "load-from-url",
            label: msg("plugins.customCss.load"),
            type: "input",
            value: "https://m.ccw.site/gandi/default.css",
            description: msg("plugins.customCss.load.description"),
            onChange: (value: string) => {
              // var允许重复定义，这里方便一些直接使用
              let pd = value.substring(0, 3);
              if ((pd = "http")) {
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
