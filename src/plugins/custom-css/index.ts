import CustomCssIcon from "assets/icon--custom-css.svg";
import React from "react";

import presetThemes from "./presetThemes.less";
import { isDarkColor } from "./colorUtils";

// 自动计算主题配置数组
// id: 主题ID，用于国际化和主题类名
// color1: 主色（背景色）
// color2: 附色（UI元素色）
const autoThemes = [
  { id: "oceanBlue", color1: "#1A3A5A", color2: "#00BFFF" },
  { id: "mintChocolate", color1: "#2D3436", color2: "#6ACDAF" },
  { id: "sunsetOrange", color1: "#2D3436", color2: "#FF7675" },
  { id: "greatPurpleAsBlue", color1: "#402F64", color2: "#70BED2" },
];

const CustomCss = ({ registerSettings, msg }: PluginContext) => {
  // 预设主题列表，包括静态预设和自动计算预设
  let presets = [
    "frostBlueIce",
    "turbowarpDark",
    "darkPurpleApricot",
    "penguinmodDark",
    "beanGreenDarkPurple",
    ...autoThemes.map((theme) => theme.id), // 添加自动计算主题
  ];
  const CUSTOM_THEME_CLASS = "customTheme";

  // 初始化状态 - 使用普通变量而非React Hooks（FIX AT 2025/4/10 22:20 REACT HOOKS WILL HAS ERROR WHEN WE USE IT IN GANDI-PLUGIN）
  let mainColor = "#E8F1F5";
  let accentColor = "#0FB1CA";
  let customThemeEnabled = false;
  let currentTheme = "none";

  // 检查主题是否存在于presetThemes.less中(TO LET TWO THEME MODELS WORK)
  const isPresetTheme = (themeName: any): boolean => {
    if (typeof themeName !== "string") return false;
    return themeName !== "none" && presets.includes(themeName);
  };

  // 检查是否是自动计算主题
  const isAutoTheme = (themeName: any): boolean => {
    if (typeof themeName !== "string") return false;
    const colors = themeName.split("_");
    return colors.length === 2 && colors[0].startsWith("#") && colors[1].startsWith("#");
  };

  // 从自动计算主题名称中提取颜色
  const extractColorsFromTheme = (themeName: string): { mainColor: string; accentColor: string } | null => {
    if (!isAutoTheme(themeName)) return null;
    const colors = themeName.split("_");
    return {
      mainColor: colors[0],
      accentColor: colors[1],
    };
  };

  // 生成自动计算主题的名称
  const generateAutoThemeName = (mainColor: string, accentColor: string): string => {
    return `${mainColor}_${accentColor}`;
  };

  const linkDom = document.createElement("link");
  linkDom.type = "text/css";
  linkDom.rel = "stylesheet";
  linkDom.id = "custom-css";
  document.getElementsByTagName("head")[0].appendChild(linkDom);

  // 初始化自定义主题的样式元素
  const customStyleElement = document.createElement("style");
  customStyleElement.id = "custom-theme-style";
  document.head.appendChild(customStyleElement);

  // 检查当前是否已经应用了主题
  const checkAndSetThemeAttribute = () => {
    // 检查预设主题
    for (const preset of presets) {
      if (document.body.classList.contains(presetThemes[preset])) {
        if (preset === "frostBlueIce") {
          document.documentElement.setAttribute("theme", "light");
          currentTheme = preset;
          return;
        } else if (["turbowarpDark", "darkPurpleApricot", "penguinmodDark", "beanGreenDarkPurple"].includes(preset)) {
          document.documentElement.setAttribute("theme", "dark");
          currentTheme = preset;
          return;
        } else {
          // 检查是否是自动计算主题
          const autoTheme = autoThemes.find((theme) => theme.id === preset);
          if (autoTheme) {
            // 判断是深色还是浅色主题
            const isDark = isDarkColor(autoTheme.color1);
            document.documentElement.setAttribute("theme", isDark ? "dark" : "light");
            currentTheme = preset;
            return;
          }
        }
      }
    }

    // 检查自定义主题
    if (document.body.classList.contains(CUSTOM_THEME_CLASS)) {
      const isDark = isDarkColor(mainColor);
      document.documentElement.setAttribute("theme", isDark ? "dark" : "light");

      // 更新当前主题为自动计算主题
      currentTheme = generateAutoThemeName(mainColor, accentColor);
    } else {
      // 如果没有应用任何主题，设置为"none"
      currentTheme = "none";
    }
  };

  // 初始化自动计算主题
  const initAutoThemes = () => {
    // 遍历自动计算主题配置
    for (const theme of autoThemes) {
      // 创建样式元素
      const styleElement = document.createElement("style");
      styleElement.id = `auto-theme-${theme.id}`;
      document.head.appendChild(styleElement);

      // 生成CSS
      const tempMainColor = mainColor;
      const tempAccentColor = accentColor;

      // 设置主题颜色
      mainColor = theme.color1;
      accentColor = theme.color2;

      // 生成CSS
      const isDark = isDarkColor(mainColor);

      // 生成CSS - 严格按照模板格式
      let css = `.${theme.id} {\n`;

      // 添加全局样式
      css += `  :global(.gandi_menu-bar_menu-bar_JcuHF),\n`;
      css += `  :global(.gandi_vertical-bar_bar_Tsvpu) {\n`;
      css += `    background-color: ${mainColor};\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_editor-wrapper_tab_2OPuA.gandi_editor-wrapper_selected_1drBd) {\n`;
      css += `    color: var(--theme-brand-color);\n`;
      css += `    background-color: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_editor-wrapper_tab_2OPuA) {\n`;
      css += `    background-color: ${mainColor};\n`;
      css += `    border-radius: 1rem 1rem 0 0;\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_editor-wrapper_tab_2OPuA):hover {\n`;
      css += `    background-color: var(--theme-color-300);\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_editor-wrapper_tabList_4HFZz) {\n`;
      css += `    border-radius: 1rem 1rem 0 0;\n`;
      css += `    margin: 6px 0 0 4px;\n`;
      css += `  }\n\n`;

      css += `  :global(.blocklyToolboxDiv) {\n`;
      css += `    background-color: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `    border-radius: 0px 0px 8px 8px;\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_stage-selector_stage-selector_3oWOr):hover,\n`;
      css += `  :global(.addons_tip-icon_oy8QS):hover,\n`;
      css += `  :global(.gandi_plugin-tooltip_tip-icon_1pyZM):hover,\n`;
      css += `  :global(.gandi_input_input-form_l9eYg):hover {\n`;
      css += `    border-color: ${accentColor};\n`;
      css += `    border-width: 1px;\n`;
      css += `    border-style: solid;\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_input_input-form_l9eYg) {\n`;
      css += `    border-radius: 2rem;\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_action-menu_more-button_1fMGZ),\n`;
      css += `  :global(.gandi_action-menu_more-buttons-outer_3J9yZ) {\n`;
      css += `    background: ${accentColor};\n`;
      css += `  }\n`;
      css += `  :global(.gandi_action-menu_more-button_1fMGZ):hover,\n`;
      css += `  :global(.gandi_modal_header-item-title_tLOU5) {\n`;
      css += `    background: ${adjustBrightness(accentColor, 10)};\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_collapsible-box_collapsible-box_1_329),\n`;
      css += `  :global(.gandi_stage-wrapper_stage-wrapper_2bejr.gandi_stage-wrapper_full-screen_2hjMb) {\n`;
      css += `    background-color: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `  }\n`;
      css += `  :global(.gandi_plugins_plugins-root_xA3t3),\n`;
      css += `  :global(.gandi_target-pane_count_3fmUd),\n`;
      css += `  :global(.gandi_extension-item_extensionItem_d06hF),\n`;
      css += `  :global(.gandi_asset-panel_wrapper_366X0),\n`;
      css += `  :global(.blocklyWidgetDiv .goog-menu),\n`;
      css += `  :global(.gandi_stage-header_stage-header-wrapper-overlay_5vfJa) {\n`;
      css += `    background: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `  }\n\n`;

      css += `  :global(.blocklyWidgetDiv .goog-menu) {\n`;
      css += `    border-color: ${addAlpha(accentColor, 0.25)};\n`;
      css += `    color: ${isDark ? "#eeeeee" : "#333333"};\n`;
      css += `    border-style: solid;\n`;
      css += `    border-width: 1px;\n`;
      css += `    border-radius: 5px;\n`;
      css += `    margin: 0;\n`;
      css += `    outline: none;\n`;
      css += `    padding: 4px 0;\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_sprite-selector_scroll-wrapper_3NNnc) {\n`;
      css += `    background-color: var(--theme-color-b200);\n`;
      css += `    border-color: var(--theme-border-color-tip);\n`;
      css += `    border-width: 1px;\n`;
      css += `    border-style: solid;\n`;
      css += `  }\n`;
      css += `  :global(.gandi_target-pane_count_3fmUd) {\n`;
      css += `    border-top: 1px solid var(--theme-border-color-tip);\n`;
      css += `  }\n\n`;

      css += `  :global(.gandi_library_library-scroll-grid_1jyXm),\n`;
      css += `  :global(.gandi_library_filter-bar_1W0DW) {\n`;
      css += `    background-color: ${isDark ? adjustBrightness(mainColor, 10) : adjustBrightness(mainColor, -5)};\n`;
      css += `  }\n`;

      css += `}\n\n`;

      // 添加CSS变量 - 严格按照模板格式
      css += `:root .${theme.id} {\n`;
      css += `  --theme-yellow-color: #ffc700;\n`;
      css += `  --theme-brand-color: ${accentColor};\n`;
      css += `  --theme-error-color: hsla(30, 100%, 55%, 1);\n`;
      css += `  --theme-brand-color-p4: ${addAlpha(accentColor, 0.35)};\n`;
      css += `  --theme-brand-color-p3: ${addAlpha(adjustBrightness(accentColor, 10), 0.5)};\n`;
      css += `  --theme-error-color-p3: hsla(30, 100%, 55%, 0.25);\n\n`;

      css += `  --theme-color-700: ${accentColor};\n`;
      css += `  --theme-color-600: ${adjustBrightness(accentColor, -10)};\n`;
      css += `  --theme-color-550: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `  --theme-color-500: ${mainColor}; //editor background\n`;
      css += `  --theme-color-400: ${isDark ? adjustBrightness(mainColor, 5) : adjustBrightness(mainColor, -5)};\n`;
      css += `  --theme-color-350: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `  --theme-color-300: ${isDark ? adjustBrightness(mainColor, 10) : adjustBrightness(mainColor, -10)}; //editor background dots\n`;
      css += `  --theme-color-200: ${isDark ? (mainColor === "#1e1e1e" ? "#111111" : adjustBrightness(mainColor, 5)) : "#ffffff"};\n`;
      css += `  --theme-color-150: ${isDark ? adjustBrightness(mainColor, 10) : adjustBrightness(mainColor, -5)};\n`;
      css += `  --theme-color-100: ${mainColor};\n`;
      css += `  --theme-color-50: ${isDark ? adjustBrightness(mainColor, 15) : adjustBrightness(mainColor, -15)};\n`;
      css += `  --theme-color-b100: ${accentColor};\n`;
      css += `  --theme-color-b200: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
      css += `  --theme-color-g500: #808080;\n`;
      css += `  --theme-color-g450: rgba(156, 163, 175, 0.4);\n`;
      css += `  --theme-color-g400: ${isDark ? "#eeeeee" : "#333333"};\n`;
      css += `  --theme-color-g300: ${isDark ? "#b3b3b3" : "#555555"};\n`;
      css += `  --theme-text-primary: ${isDark ? "#eeeeee" : "#333333"};\n`;
      css += `  --theme-border-color-tip: ${addAlpha(accentColor, 0.25)};\n\n`;

      css += `  --gui-item-active-transparent: ${addAlpha(accentColor, 0.35)};\n`;
      css += `}\n`;

      // 设置CSS
      styleElement.textContent = css;

      // 将主题添加到presetThemes对象中
      presetThemes[theme.id] = theme.id;

      // 恢复原来的颜色
      mainColor = tempMainColor;
      accentColor = tempAccentColor;
    }
  };

  // 初始化时检查并设置主题
  checkAndSetThemeAttribute();

  // 初始化自动计算主题
  initAutoThemes();

  const removeAllStyles = () => {
    for (let i in presets) {
      document.body.classList.remove(presetThemes[presets[i]]);
    }
    // 移除自定义主题类
    document.body.classList.remove(CUSTOM_THEME_CLASS);
    // ！踩雷：不可以移除该属性！
    // document.documentElement.removeAttribute("theme");
  };

  // 应用自定义主题
  const applyCustomTheme = () => {
    removeAllStyles();

    const isDark = isDarkColor(mainColor);

    // 生成主题颜色 - 不再使用自动生成的主题颜色
    // const themeColors = generateThemeColors(mainColor, accentColor, isDark);

    let css = `.${CUSTOM_THEME_CLASS} {\n`;

    // 添加全局样式
    css += `  :global(.gandi_menu-bar_menu-bar_JcuHF),\n`;
    css += `  :global(.gandi_vertical-bar_bar_Tsvpu) {\n`;
    css += `    background-color: ${mainColor};\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_editor-wrapper_tab_2OPuA.gandi_editor-wrapper_selected_1drBd) {\n`;
    css += `    color: var(--theme-brand-color);\n`;
    css += `    background-color: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_editor-wrapper_tab_2OPuA) {\n`;
    css += `    background-color: ${mainColor};\n`;
    css += `    border-radius: 1rem 1rem 0 0;\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_editor-wrapper_tab_2OPuA):hover {\n`;
    css += `    background-color: var(--theme-color-300);\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_editor-wrapper_tabList_4HFZz) {\n`;
    css += `    border-radius: 1rem 1rem 0 0;\n`;
    css += `    margin: 6px 0 0 4px;\n`;
    css += `  }\n\n`;

    css += `  :global(.blocklyToolboxDiv) {\n`;
    css += `    background-color: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `    border-radius: 0px 0px 8px 8px;\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_stage-selector_stage-selector_3oWOr):hover,\n`;
    css += `  :global(.addons_tip-icon_oy8QS):hover,\n`;
    css += `  :global(.gandi_plugin-tooltip_tip-icon_1pyZM):hover,\n`;
    css += `  :global(.gandi_input_input-form_l9eYg):hover {\n`;
    css += `    border-color: ${accentColor};\n`;
    css += `    border-width: 1px;\n`;
    css += `    border-style: solid;\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_input_input-form_l9eYg) {\n`;
    css += `    border-radius: 2rem;\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_action-menu_more-button_1fMGZ),\n`;
    css += `  :global(.gandi_action-menu_more-buttons-outer_3J9yZ) {\n`;
    css += `    background: ${accentColor};\n`;
    css += `  }\n`;
    css += `  :global(.gandi_action-menu_more-button_1fMGZ):hover,\n`;
    css += `  :global(.gandi_modal_header-item-title_tLOU5) {\n`;
    css += `    background: ${adjustBrightness(accentColor, 10)};\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_collapsible-box_collapsible-box_1_329),\n`;
    css += `  :global(.gandi_stage-wrapper_stage-wrapper_2bejr.gandi_stage-wrapper_full-screen_2hjMb) {\n`;
    css += `    background-color: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  }\n`;
    css += `  :global(.gandi_plugins_plugins-root_xA3t3),\n`;
    css += `  :global(.gandi_target-pane_count_3fmUd),\n`;
    css += `  :global(.gandi_extension-item_extensionItem_d06hF),\n`;
    css += `  :global(.gandi_asset-panel_wrapper_366X0),\n`;
    css += `  :global(.blocklyWidgetDiv .goog-menu),\n`;
    css += `  :global(.gandi_stage-header_stage-header-wrapper-overlay_5vfJa) {\n`;
    css += `    background: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  }\n\n`;

    css += `  :global(.blocklyWidgetDiv .goog-menu) {\n`;
    css += `    border-color: ${addAlpha(accentColor, 0.25)};\n`;
    css += `    color: ${isDark ? "#eeeeee" : "#333333"};\n`;
    css += `    border-style: solid;\n`;
    css += `    border-width: 1px;\n`;
    css += `    border-radius: 5px;\n`;
    css += `    margin: 0;\n`;
    css += `    outline: none;\n`;
    css += `    padding: 4px 0;\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_sprite-selector_scroll-wrapper_3NNnc) {\n`;
    css += `    background-color: var(--theme-color-b200);\n`;
    css += `    border-color: var(--theme-border-color-tip);\n`;
    css += `    border-width: 1px;\n`;
    css += `    border-style: solid;\n`;
    css += `  }\n`;
    css += `  :global(.gandi_target-pane_count_3fmUd) {\n`;
    css += `    border-top: 1px solid var(--theme-border-color-tip);\n`;
    css += `  }\n\n`;

    css += `  :global(.gandi_library_library-scroll-grid_1jyXm),\n`;
    css += `  :global(.gandi_library_filter-bar_1W0DW) {\n`;
    css += `    background-color: ${isDark ? adjustBrightness(mainColor, 10) : adjustBrightness(mainColor, -5)};\n`;
    css += `  }\n`;

    css += `}\n\n`;

    // 添加CSS变量 - 严格按照模板格式
    css += `:root .${CUSTOM_THEME_CLASS} {\n`;
    css += `  --theme-yellow-color: #ffc700;\n`;
    css += `  --theme-brand-color: ${accentColor};\n`;
    css += `  --theme-error-color: hsla(30, 100%, 55%, 1);\n`;
    css += `  --theme-brand-color-p4: ${addAlpha(accentColor, 0.35)};\n`;
    css += `  --theme-brand-color-p3: ${addAlpha(adjustBrightness(accentColor, 10), 0.5)};\n`;
    css += `  --theme-error-color-p3: hsla(30, 100%, 55%, 0.25);\n\n`;

    css += `  --theme-color-700: ${accentColor};\n`;
    css += `  --theme-color-600: ${adjustBrightness(accentColor, -10)};\n`;
    css += `  --theme-color-550: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  --theme-color-500: ${mainColor}; //editor background\n`;
    css += `  --theme-color-400: ${isDark ? adjustBrightness(mainColor, 5) : adjustBrightness(mainColor, -5)};\n`;
    css += `  --theme-color-350: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  --theme-color-300: ${isDark ? adjustBrightness(mainColor, 10) : adjustBrightness(mainColor, -10)}; //editor background dots\n`;
    css += `  --theme-color-200: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  --theme-color-150: ${isDark ? adjustBrightness(mainColor, 10) : adjustBrightness(mainColor, -5)};\n`;
    css += `  --theme-color-100: ${mainColor};\n`;
    css += `  --theme-color-50: ${isDark ? adjustBrightness(mainColor, 15) : adjustBrightness(mainColor, -15)};\n`;
    css += `  --theme-color-b100: ${accentColor};\n`;
    css += `  --theme-color-b200: ${isDark ? adjustBrightness(mainColor, 5) : "#ffffff"};\n`;
    css += `  --theme-color-g500: #808080;\n`;
    css += `  --theme-color-g450: rgba(156, 163, 175, 0.4);\n`;
    css += `  --theme-color-g400: ${isDark ? "#eeeeee" : "#333333"};\n`;
    css += `  --theme-color-g300: ${isDark ? "#b3b3b3" : "#555555"};\n`;
    css += `  --theme-text-primary: ${isDark ? "#eeeeee" : "#333333"};\n`;
    css += `  --theme-border-color-tip: ${addAlpha(accentColor, 0.25)};\n\n`;

    css += `  --gui-item-active-transparent: ${addAlpha(accentColor, 0.35)};\n`;
    css += `}\n`;

    // 设置CSS
    customStyleElement.textContent = css;

    // 添加类
    document.body.classList.add(CUSTOM_THEME_CLASS);

    // 设置theme属性
    document.documentElement.setAttribute("theme", isDark ? "dark" : "light");
  };

  // 辅助函数
  function adjustBrightness(hex: string, amount: number): string {
    // 简化版调整亮度函数
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    rgb.r = Math.max(0, Math.min(255, rgb.r + amount));
    rgb.g = Math.max(0, Math.min(255, rgb.g + amount));
    rgb.b = Math.max(0, Math.min(255, rgb.b + amount));

    return rgbToHex(rgb);
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  function rgbToHex(rgb: { r: number; g: number; b: number }): string {
    return "#" + ((1 << 24) | (rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16).slice(1);
  }

  function addAlpha(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `${hex}${Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`;
  }

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
            value: "frostBlueIce",
            options: generateOptions(),
            onChange: (value) => {
              // 更新当前主题
              currentTheme = value as string;

              if (value === "none") {
                // 重置为默认主题
                removeAllStyles();
              } else if (isPresetTheme(value)) {
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
                } else {
                  // 检查是否是自动计算预设主题
                  const autoTheme = autoThemes.find((theme) => theme.id === value);
                  if (autoTheme) {
                    // 判断是深色还是浅色主题
                    const isDark = isDarkColor(autoTheme.color1);
                    document.documentElement.setAttribute("theme", isDark ? "dark" : "light");
                  }
                }
              } else if (isAutoTheme(value)) {
                // 自动计算主题
                const colors = extractColorsFromTheme(value as string);
                if (colors) {
                  mainColor = colors.mainColor;
                  accentColor = colors.accentColor;
                  applyCustomTheme();
                }
              }

              // 更新设置选项
            },
          },
          {
            key: "custom-theme",
            label: msg("plugins.customCss.customTheme") || "自定义主题",
            type: "switch",
            description: msg("plugins.customCss.theme.description") || "启用自定义主题",
            value: customThemeEnabled,
            onChange: (value: boolean) => {
              customThemeEnabled = value;
              if (value) {
                // 生成自动计算主题的名称
                const autoThemeName = generateAutoThemeName(mainColor, accentColor);

                // 检查是否已经存在该自动计算主题
                let options = generateOptions();
                const existingOption = options.find((opt) => opt.value === autoThemeName);

                if (!existingOption) {
                  // 如果不存在，添加到选项中
                  const newOption = {
                    label: `${mainColor} + ${accentColor}`,
                    value: autoThemeName,
                  };

                  // 更新选项
                  const settingsElement = document.querySelector(
                    'select[data-key="presetThemes"]',
                  ) as HTMLSelectElement;
                  if (settingsElement) {
                    const option = document.createElement("option");
                    option.value = newOption.value;
                    option.textContent = newOption.label;
                    settingsElement.appendChild(option);
                  }
                }

                applyCustomTheme();

                currentTheme = autoThemeName;

                const settingsElement = document.querySelector('select[data-key="presetThemes"]') as HTMLSelectElement;
                if (settingsElement) {
                  settingsElement.value = autoThemeName;
                }
              } else {
                removeAllStyles();

                // 重置主题选择器为"none"
                const settingsElement = document.querySelector('select[data-key="presetThemes"]') as HTMLSelectElement;
                if (settingsElement) {
                  settingsElement.value = "none";
                  currentTheme = "none";
                }
              }
            },
          },
          {
            key: "main-color",
            label: msg("plugins.customCss.mainColor") || "主色(背景色)",
            type: "input",
            inputProps: {
              type: "color",
            },
            value: mainColor,
            description: msg("plugins.customCss.mainColorDesc") || "主要背景颜色",
            onChange: (value: string) => {
              mainColor = value;
              if (customThemeEnabled) {
                // 生成新的自动计算主题名称
                const newAutoThemeName = generateAutoThemeName(value, accentColor);

                // 检查是否已经存在该自动计算主题
                let options = generateOptions();
                const existingOption = options.find((opt) => opt.value === newAutoThemeName);

                if (!existingOption) {
                  // 如果不存在，添加到选项中
                  const newOption = {
                    label: `${value} + ${accentColor}`,
                    value: newAutoThemeName,
                  };

                  // 更新选项
                  const settingsElement = document.querySelector(
                    'select[data-key="presetThemes"]',
                  ) as HTMLSelectElement;
                  if (settingsElement) {
                    const option = document.createElement("option");
                    option.value = newOption.value;
                    option.textContent = newOption.label;
                    settingsElement.appendChild(option);
                    settingsElement.value = newAutoThemeName;
                  }
                }

                // 更新当前主题
                currentTheme = newAutoThemeName;

                // 应用自动计算主题
                applyCustomTheme();
              }
            },
          },
          {
            key: "accent-color",
            label: msg("plugins.customCss.accentColor") || "附色(UI元素色)",
            type: "input",
            inputProps: {
              type: "color",
            },
            value: accentColor,
            description: msg("plugins.customCss.accentColorDesc") || "UI元素颜色",
            onChange: (value: string) => {
              accentColor = value;
              if (customThemeEnabled) {
                // 生成新的自动计算主题名称
                const newAutoThemeName = generateAutoThemeName(mainColor, value);

                // 检查是否已经存在该自动计算主题
                let options = generateOptions();
                const existingOption = options.find((opt) => opt.value === newAutoThemeName);

                if (!existingOption) {
                  // 如果不存在，添加到选项中
                  const newOption = {
                    label: `${mainColor} + ${value}`,
                    value: newAutoThemeName,
                  };

                  // 更新选项
                  const settingsElement = document.querySelector(
                    'select[data-key="presetThemes"]',
                  ) as HTMLSelectElement;
                  if (settingsElement) {
                    const option = document.createElement("option");
                    option.value = newOption.value;
                    option.textContent = newOption.label;
                    settingsElement.appendChild(option);
                    settingsElement.value = newAutoThemeName;
                  }
                }

                // 更新当前主题
                currentTheme = newAutoThemeName;

                // 应用自动计算主题
                applyCustomTheme();
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
