import * as React from "react";
import KukemcBeautifyIcon from "assets/icon--kukemcbeautify.svg";

let isFrosted = false;
let transparency = 0.29;
let ambiguity = 10;
const styleElement = document.createElement("style");
document.head.appendChild(styleElement);

// Define an interface for the color in RGB format
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Helper function to convert hex color to RGB format
function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return { r, g, b };
  }
  throw new Error("Invalid hex color format");
}

// Helper function to apply style changes
function applyStyleChanges(rule: CSSStyleRule, background: string, backdropFilter: string): void {
  rule.style.backgroundColor = background;
  rule.style.backdropFilter = backdropFilter;
}

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
              label: msg("plugins.kukemcBeautify.frostedglass"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                isFrosted = value;
                if (value) {
                  groundGlass();
                } else {
                  removeGroundGlass()
                }
              },
            },
            {
              key: "transparency",
              label: msg("plugins.kukemcBeautify.transparency"),
              type: "input",
              inputProps: {
                type: "number",
              },
              value: 0.29,
              onChange: (value: number) => {
                transparency = value;
                if (isFrosted) {
                  groundGlass();
                }
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
              onChange: (value: number) => {
                ambiguity = value;
                if (isFrosted) {
                  groundGlass();
                }
              },
            },
          ],
        },
      ],
      <KukemcBeautifyIcon />, 
    );
    return () => {
      isFrosted = false
      removeGroundGlass()
      register.dispose();
    };
  }, [registerSettings, msg]);

  return null;
};

function groundGlass(): void {
  const styleElements = document.head.getElementsByTagName("style");

  const htmlElement = document.documentElement;
  const computedStyle = window.getComputedStyle(htmlElement);
  const themeColorHex = computedStyle.getPropertyValue("--theme-color-300").trim(); // Remove any potential whitespace

  const themeColorRgb = hexToRgb(themeColorHex);

  const { r, g, b } = themeColorRgb;

  try {
    for (let i = 0; i < styleElements.length; i++) {
      const sheet = styleElements[i].sheet as CSSStyleSheet;
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j] as CSSStyleRule;
          const isTargetSelector = [
            ".blocklyWidgetDiv .goog-menu",
            ".gandi_context-menu_context-menu_2SJM-",
            ".blocklyToolboxDiv",
            ".gandi_plugins_plugins-root_xA3t3",
            ".gandi_collapsible-box_collapsible-box_1_329",
            ".gandi_target-pane_count_3fmUd",
            ".gandi_editor-wrapper_tabList_4HFZz",
            ".gandi_setting-modal_modal-overlay_3wJji",
            ".gandi_bulletin-modal_modal-overlay_TBAhj",
            ".gandi_collapsible-box_header_dc9Es",
          ].includes(rule.selectorText);

          if (rule.selectorText === ".blocklyToolboxDiv") {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, ${transparency})`, `blur(${ambiguity - 5}px)`);
          } else if (isTargetSelector) {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, ${transparency})`, `blur(${ambiguity}px)`);
          }
        }
      }
    }
    styleElement.innerText = `.gandi-stage-wrapper{backdrop-filter: none;}.gandi_stage-header_stage-header-wrapper_1F4gT{backdrop-filter: blur(${ambiguity}px);}.gandi_collapsible-box_header_dc9Es{border-top-left-radius: 7px;border-top-right-radius: 7px;}`;
  } catch (error) {
    console.error("Error applying frosted glass effect:", error);
  }
}

function removeGroundGlass(): void {
  const styleElements = document.head.getElementsByTagName("style");

  const htmlElement = document.documentElement;
  const computedStyle = window.getComputedStyle(htmlElement);
  const themeColorHex = computedStyle.getPropertyValue("--theme-color-300").trim(); // Remove any potential whitespace

  const themeColorRgb = hexToRgb(themeColorHex);

  const { r, g, b } = themeColorRgb;

  try {
    for (let i = 0; i < styleElements.length; i++) {
      const sheet = styleElements[i].sheet as CSSStyleSheet;
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j] as CSSStyleRule;
          const isTargetSelector = [
            ".blocklyWidgetDiv .goog-menu",
            ".gandi_context-menu_context-menu_2SJM-",
            ".blocklyToolboxDiv",
            ".gandi_plugins_plugins-root_xA3t3",
            ".gandi_collapsible-box_collapsible-box_1_329",
            ".gandi_target-pane_count_3fmUd",
            ".gandi_editor-wrapper_tabList_4HFZz",
            ".gandi_setting-modal_modal-overlay_3wJji",
            ".gandi_bulletin-modal_modal-overlay_TBAhj",
            ".gandi_collapsible-box_header_dc9Es",
          ].includes(rule.selectorText);

          if (rule.selectorText === ".gandi_setting-modal_modal-overlay_3wJji") {
            applyStyleChanges(rule, `rgba(0,0,0,.7)`, `blur(0)`);
          } else if (rule.selectorText === ".blocklyToolboxDiv") {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, 1)`, `blur(0)`);
          } else if (isTargetSelector) {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, 1)`, `blur(0)`);
          }
        }
      }
    }
    styleElement.innerText = `.gandi_collapsible-box_header_dc9Es{border-top-left-radius: 7px;border-top-right-radius: 7px;}`;
  } catch (error) {
    console.error("Error removing frosted glass effect:", error);
  }
}


KukemcBeautify.displayName = "KukemcBeautify";

export default KukemcBeautify;
