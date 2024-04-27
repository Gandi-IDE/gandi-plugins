import * as React from "react";
import KukemcBeautifyIcon from "assets/icon--kukemcbeautify.svg";

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
  throw new Error('Invalid hex color format');
}

// Helper function to apply style changes
function applyStyleChanges(rule: CSSStyleRule, background: string, backdropFilter: string): void {
  rule.style.backgroundColor = background;
  rule.style.backdropFilter = backdropFilter;
}

// Define interface for KukemcBeautify props
interface KukemcBeautifyProps {
  blockly: any;  // Define more specific types as needed
  msg: (key: string) => string;
  registerSettings: (title: string, className: string, settings: any[], icon: JSX.Element) => { dispose: () => void };
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
              key: "dropdown",
              label: msg("plugins.kukemcBeautify.groundglass"),
              type: "switch",
              value: false,
              onChange: (value: boolean) => {
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
  const styleElements = document.head.getElementsByTagName('style');
  
  const htmlElement = document.documentElement;
  const computedStyle = window.getComputedStyle(htmlElement);
  const themeColorHex = computedStyle.getPropertyValue('--theme-color-300').trim(); // Remove any potential whitespace

  const themeColorRgb = hexToRgb(themeColorHex);

  const { r, g, b } = themeColorRgb;

  try {
    for (let i = 0; i < styleElements.length; i++) {
      const sheet = styleElements[i].sheet as CSSStyleSheet;
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j] as CSSStyleRule;
          const isTargetSelector = [
            '.blocklyWidgetDiv .goog-menu',
            '.gandi_context-menu_context-menu_2SJM-',
            '.blocklyToolboxDiv',
            '.gandi_plugins_plugins-root_xA3t3',
            '.gandi_collapsible-box_collapsible-box_1_329',
            '.gandi_target-pane_count_3fmUd',
            '.gandi_editor-wrapper_tabList_4HFZz',
            '.gandi_setting-modal_modal-overlay_3wJji',
            '.gandi_bulletin-modal_modal-overlay_TBAhj',
          ].includes(rule.selectorText);

          if (rule.selectorText === '.blocklyToolboxDiv') {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, 0.10)`, 'blur(5px)');
          } else if (rule.selectorText === '.gandi_collapsible-box_collapsible-box_1_329') {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, 0.29)`, '');
          } else if (isTargetSelector) {
            applyStyleChanges(rule, `rgba(${r}, ${g}, ${b}, 0.29)`, 'blur(10px)');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error applying ground glass effect:', error);
  }
}

KukemcBeautify.displayName = "KukemcBeautify";

export default KukemcBeautify;