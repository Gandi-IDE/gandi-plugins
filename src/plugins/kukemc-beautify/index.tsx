import * as React from "react";
import KukemcBeautifyIcon from "assets/icon--kukemcbeautify.svg";
import "./styles.less";

let ground = false;
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

function calculateSafePosition(dom1, dom2, targetCoordinate) {
  const dom1Rect = dom1.getBoundingClientRect();
  const dom2Rect = dom2.getBoundingClientRect();

  let newX = targetCoordinate.x;
  let newY = targetCoordinate.y;

  if (newX + dom2Rect.width > dom1Rect.right) {
    newX = dom1Rect.right - dom2Rect.width;
  }
  if (newY + dom2Rect.height > dom1Rect.bottom) {
    newY = dom1Rect.bottom - dom2Rect.height;
  }
  if (newX < dom1Rect.left) {
    newX = dom1Rect.left;
  }
  if (newY < dom1Rect.top) {
    newY = dom1Rect.top;
  }

  return { x: newX - dom1Rect.left, y: newY - dom1Rect.top };
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
              label: msg("plugins.kukemcBeautify.groundglass"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
                ground = value;
                if (value) {
                  groundGlass();
                } else {
                  const userChoice = confirm(msg("plugins.kukemcBeautify.confirm"));
                  if (userChoice) {
                    setTimeout(() => {
                      location.reload();
                    }, 500);
                  }
                }
              },
            },
            {
              key: "transparent",
              label: msg("plugins.kukemcBeautify.transparent"),
              type: "input",
              inputProps: {
                type: "number",
              },
              value: 0.29,
              onChange: (value: number) => {
                transparency = value;
                if (ground) {
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
                if (ground) {
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
          } else if (rule.selectorText === ".gandi_context-menu_context-menu_2SJM-") {
            rule.style.top = `var(--kuke-context-menu-top) !important`;
            rule.style.left = `var(--kuke-context-menu-left) !important`;
          } else if (isTargetSelector) {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, ${transparency})`, `blur(${ambiguity}px)`);
          }
        }
      }
    }
    styleElement.innerText = `.gandi-stage-wrapper{backdrop-filter: none;}.gandi_stage-header_stage-header-wrapper_1F4gT{backdrop-filter: blur(${ambiguity}px);}.gandi_collapsible-box_header_dc9Es{border-top-left-radius: 7px;border-top-right-radius: 7px;}.gandi_context-menu_context-menu_2SJM- {top: var(--kuke-context-menu-top) !important;left: var(--kuke-context-menu-left) !important;}`;
    const handleClick = (event: MouseEvent) => {
      if (event.button === 2) {
        const target = event.target as HTMLElement;
        Array.from(document.getElementsByClassName("gandi_sprite-selector_sprite_21WnR")).forEach((element) => {
          if (element.parentElement.contains(target)) {
            Array.from(document.getElementsByClassName("gandi_context-menu_context-menu_2SJM-")).forEach((ev) => {
              if (element.contains(ev)) {
                try {
                  const p = calculateSafePosition(
                    document.getElementsByClassName("gandi_collapsible-box_collapsible-box_1_329")[1],
                    ev,
                    { x: event.clientX, y: event.clientY },
                  );
                  document.documentElement.style.setProperty("--kuke-context-menu-top", `${p.y}px`);
                  document.documentElement.style.setProperty("--kuke-context-menu-left", `${p.x}px`);
                } catch (error) {
                  return;
                }
                return;
              }
            });
            return;
          }
        });
      }
    };
    try {
      document.removeEventListener("mouseup", handleClick);
      document.addEventListener("mouseup", handleClick);
    } catch (e) {
      document.addEventListener("mouseup", handleClick);
    }
  } catch (error) {
    console.error("Error applying ground glass effect:", error);
  }
}

KukemcBeautify.displayName = "KukemcBeautify";

export default KukemcBeautify;
