import * as React from "react";
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
  unavailablePlugins: string[];
  loadAndInjectPlugin: (name: string) => void;
}

const PluginsManager: React.FC<PluginsManagerProps> = ({
  registerSettings,
  msg,
  intl,
  plugins,
  disabledPlugins,
  unavailablePlugins,
  loadAndInjectPlugin,
}) => {
  const defaultInjectedPlugins = React.useMemo(
    () => DEFAULT_INJECT_PLUGINS.filter((n) => !disabledPlugins.includes(spinalToCamel(n))),
    [disabledPlugins],
  );

  React.useEffect(() => {
    defaultInjectedPlugins.forEach((name) => {
      loadAndInjectPlugin(name);
    });
  }, [defaultInjectedPlugins]);

  React.useEffect(() => {
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
          items: ALL_PLUGINS.filter((i) => !unavailablePlugins.includes(i)).map((key) => {
            const pluginName = spinalToCamel(key);
            const title = messages[`plugins.${pluginName}.title`] ? msg(`plugins.${pluginName}.title`) : key;
            return {
              key: pluginName,
              label: title,
              type: "switch",
              value: defaultInjectedPlugins.includes(key),
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
                if (disabledPlugins.includes(pluginName)) {
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
          }),
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
