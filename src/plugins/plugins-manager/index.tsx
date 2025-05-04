import * as React from "react";
import { noop } from "lodash-es";
import { Toaster } from "react-hot-toast";
import { spinalToCamel } from "utils/name-helper";
import PluginsManagerIcon from "assets/icon--plugins-manage.svg";
import pluginsManifest from "src/plugins-manifest";
import Plugins from "../../plugins-entry";
import messages from "../../l10n/en.json";
import { LoadingPlugins } from "src/plugins-controller";
import styles from "./styles.less";

const ALL_PLUGINS = Object.keys(Plugins);
// When the line numbers of the variables below change, plopfile.js needs to be updated.
const DEFAULT_INJECT_PLUGINS = [
  "clean-pro",
  "block-sharing",
  "custom-plugin",
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
  disabledPlugins: string[];
  loadAndInjectPlugin: (name: string) => void;
}

const PluginsManager: React.FC<PluginsManagerProps> = ({
  registerSettings,
  msg,
  intl,
  plugins,
  disabledPlugins,
  loadAndInjectPlugin,
}) => {
  React.useEffect(() => {
    const pluginSettings = ALL_PLUGINS.reduce((acc: Array<PluginSetting>, key) => {
      const pluginName = spinalToCamel(key);
      // Disabled plugins will not be visible in the plugin list unless they are allowed to be default-loaded.
      // Even for default-loaded plugins, if they are on the disabled list, they will only be visible in the plugin list but cannot be loaded or enabled.
      if (disabledPlugins.includes(key) && !DEFAULT_INJECT_PLUGINS.includes(key)) return acc;

      const title = messages[`plugins.${pluginName}.title`] ? msg(`plugins.${pluginName}.title`) : key;
      const pluginSetting: PluginSetting = {
        key: pluginName,
        label: title,
        type: "switch",
        value: false,
        disabled: disabledPlugins.includes(key),
        tags: pluginsManifest[key].credits || [],
        description: messages[`plugins.${pluginName}.description`]
          ? `${msg(`plugins.${pluginName}.description`)}`
          : null,
        onChange: (value: boolean, cancelChange: () => void) => {
          if (value === false && LoadingPlugins[key]) {
            // If the plug-in is loading, do not allow it to be injected
            LoadingPlugins[key]();
            return;
          }
          if (value === true && LoadingPlugins[key]) {
            // If the plug-in is in the process of loading, you do not need to load it again
            return;
          }
          if (disabledPlugins.includes(key)) {
            // If the plug-in is only used, but wants to be loaded, cancel it
            cancelChange();
            return;
          }
          if (value && !plugins[key]) {
            loadAndInjectPlugin(key);
          } else if (plugins[key]) {
            plugins[key]();
            delete plugins[key];
          }
        },
      };
      if (DEFAULT_INJECT_PLUGINS.includes(key)) {
        pluginSetting.onChange(true, noop);
      }
      return acc.concat(pluginSetting);
    }, []);
    const register = registerSettings(
      msg("plugins.pluginsManager.title"),
      "plugins-manager",
      [
        {
          key: "plugins",
          label: msg("plugins.pluginsManager.title"),
          description: (
            <>
              {`${msg("plugins.pluginsManager.description")}`}
              <br />
              {intl.formatMessage(
                {
                  id: "plugins.pluginsManager.contributing",
                  defaultMessage: "All plugins are open source and can be viewed and created at {href}.",
                  description: "The description of the plugins",
                },
                {
                  href: (
                    <a
                      href="https://github.com/Gandi-IDE/gandi-plugins"
                      target="_blank"
                      rel="noreferrer"
                      key="more"
                      className={styles.more}
                    >
                      {msg("plugins.pluginsManager.moreInfo")}
                    </a>
                  ),
                },
              )}
            </>
          ),
          items: pluginSettings,
        },
      ],
      <PluginsManagerIcon />,
    );
    return () => {
      register.dispose();
    };
  }, [registerSettings, msg, plugins, disabledPlugins, loadAndInjectPlugin]);

  return <Toaster />;
};

PluginsManager.displayName = "PluginsManager";

export default PluginsManager;
