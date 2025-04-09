import CustomCssIcon from "assets/icon--custom-css.svg";
import React from "react";

import presetThemes from "./presetThemes.less";

const CustomCss = ({ registerSettings, msg }: PluginContext) => {
  let presets = ["frostBlueIce", "turbowarpDark", "darkPurpleApricot", "penguinmodDark", "beanGreenDarkPurple"];

  const linkDom = document.createElement("link");
  linkDom.type = "text/css";
  linkDom.rel = "stylesheet";
  linkDom.id = "custom-css";
  document.getElementsByTagName("head")[0].appendChild(linkDom);

  // 检查当前是否已经应用了主题
  const checkAndSetThemeAttribute = () => {
    for (const preset of presets) {
      if (document.body.classList.contains(presetThemes[preset])) {
        if (preset === "frostBlueIce") {
          document.documentElement.setAttribute("theme", "light");
          return;
        } else if (["turbowarpDark", "darkPurpleApricot", "penguinmodDark", "beanGreenDarkPurple"].includes(preset)) {
          document.documentElement.setAttribute("theme", "dark");
          return;
        }
      }
    }
  };

  // 初始化时检查并设置主题
  checkAndSetThemeAttribute();

  const removeAllStyles = () => {
    for (let i in presets) {
      document.body.classList.remove(presetThemes[presets[i]]);
    }
    // ！踩雷：不可以移除该属性！
    // document.documentElement.removeAttribute("theme");
  };

  const generateOptions = () => {
    let options = [{ label: msg("plugins.customCss.theme.none"), value: "none" }];
    for (let i in presets) {
      options.push({ label: msg(`plugins.customCss.theme.${presets[i]}`), value: presets[i] });
    }
    return options;
  };

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
            key: "presetThemes",
            type: "select",
            label: msg("plugins.customCss.theme"),
            value: "none",
            options: generateOptions(),
            onChange: (value) => {
              switch (value) {
                default:
                  removeAllStyles();
                  document.body.classList.add(presetThemes[value as any]);
                  // 设置theme属性
                  if (value === "frostBlueIce") {
                    document.documentElement.setAttribute("theme", "light");
                  } else if (
                    ["turbowarpDark", "darkPurpleApricot", "penguinmodDark", "beanGreenDarkPurple"].includes(
                      value as string,
                    )
                  ) {
                    document.documentElement.setAttribute("theme", "dark");
                  }
                  break;
                case "none":
                  removeAllStyles();
                  // 重置为默认主题
                  document.documentElement.removeAttribute("theme");
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
