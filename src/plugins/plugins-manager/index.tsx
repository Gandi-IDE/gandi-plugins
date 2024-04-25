import * as React from "react";
import { spinalToCamel } from "utils/name-helper";
import PluginsManagerIcon from "assets/icon--plugins-manage.svg";
import Plugins from "../../plugins-entry";
import messages from "../../l10n/en.json";
import { LoadingPlugins } from "src/plugins-controller";

const ALL_PLUGINS = Object.keys(Plugins);
// When the line numbers of the variables below change, plopfile.js needs to be updated.
const DEFAULT_INJECT_PLUGINS = [
  "no-popups",
  "folder",
  "statistics",
  "terminal",
  "code-find",
  "code-filter",
  "dev-tools",
  "code-switch",
  "code-batch-select",
  "dropdown-searchable",
  "historical-version",
];
interface PluginsManagerProps extends PluginContext {
  plugins: Record<string, () => void>;
  loadAndInjectPlugin: (name: string) => void;
}

const PluginsManager: React.FC<PluginsManagerProps> = ({ registerSettings, msg, plugins, loadAndInjectPlugin }) => {
  const customPluginScript = React.useRef<HTMLScriptElement>();

  const loadPluginURL = React.useCallback((url: string) => {
    if (/^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*\.js$/.test(url)) {
      if (customPluginScript.current) {
        document.body.removeChild(customPluginScript.current);
      }
      customPluginScript.current = document.createElement("script");
      customPluginScript.current.src = url;
      document.body.appendChild(customPluginScript.current);
    }
  }, []);

  React.useEffect(() => {
    DEFAULT_INJECT_PLUGINS.forEach(loadAndInjectPlugin);
  }, []);

  React.useEffect(() => {
    const items = [
      {
        key: "customPlugin",
        label: msg("plugins.pluginsManager.customPlugin.promptURL"),
        type: "input",
        value: "",
        autoSave: false,
        onChange: loadPluginURL,
      },
      ...ALL_PLUGINS.map((key) => {
        const title = messages[`plugins.${spinalToCamel(key)}.title`]
          ? msg(`plugins.${spinalToCamel(key)}.title`)
          : key;
        return {
          key: spinalToCamel(key),
          label: title,
          type: "switch",
          value: DEFAULT_INJECT_PLUGINS.includes(key),
          description: messages[`plugins.${spinalToCamel(key)}.description`]
            ? msg(`plugins.${spinalToCamel(key)}.description`)
            : null,
          onChange: (value: boolean) => {
            if (value === false && LoadingPlugins[key]) {
              LoadingPlugins[key]();
            } else if (!LoadingPlugins[key]) {
              if (value && !plugins[key]) {
                loadAndInjectPlugin(key);
              } else if (plugins[key]) {
                plugins[key]();
                delete plugins[key];
              }
            }
          },
        };
      }),
    ] as Array<PluginSetting>;
    const register = registerSettings(
      msg("plugins.pluginsManager.title"),
      "plugins-manager",
      [
        {
          key: "plugins",
          label: msg("plugins.pluginsManager.title"),
          description: msg("plugins.pluginsManager.description"),
          items,
        },
      ],
      <PluginsManagerIcon />,
    );
    return () => {
      register.dispose();
    };
  }, [registerSettings, msg, plugins, loadAndInjectPlugin]);

  return null;
};

PluginsManager.displayName = "PluginsManager";

export default PluginsManager;
