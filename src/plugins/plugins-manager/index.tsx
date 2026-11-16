import * as React from "react";
import { Toaster } from "react-hot-toast";
import { spinalToCamel } from "utils/name-helper";
import PluginsManagerIcon from "assets/icon--plugins-manage.svg";
import pluginsManifest from "src/plugins-manifest";
import Plugins from "../../plugins-entry";
import messages from "../../l10n/en.json";
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
  disabledPlugins: string[];
  collaborationBlockedPlugin: string | null;
  setPluginEnabled: (name: string, enabled: boolean) => void;
}

function showCollaborationNotice(sessionId: string, message: string) {
  // The host can replace the entire plugin bundle several times during one session.
  const { body } = document;
  if (body.dataset.gandiEditorOptimizationNotice === sessionId) return;
  body.dataset.gandiEditorOptimizationNotice = sessionId;
  const notice = document.createElement("div");
  notice.className = styles.collaborationNotice;
  notice.setAttribute("role", "status");
  notice.textContent = message;
  body.appendChild(notice);
  window.setTimeout(() => notice.remove(), 5000);
}

const PluginsManager: React.FC<PluginsManagerProps> = ({
  registerSettings,
  msg,
  intl,
  disabledPlugins,
  collaborationBlockedPlugin,
  teamworkManager,
  setPluginEnabled,
}) => {
  React.useEffect(() => {
    const pluginSettings = ALL_PLUGINS.reduce((acc: Array<PluginSetting>, key) => {
      const pluginName = spinalToCamel(key);
      // Disabled plugins will not be visible in the plugin list unless they are allowed to be default-loaded.
      // Even for default-loaded plugins, if they are on the disabled list, they will only be visible in the plugin list but cannot be loaded or enabled.
      if (disabledPlugins.includes(key) && !DEFAULT_INJECT_PLUGINS.includes(key)) return acc;

      const blockedInCollaboration = key === collaborationBlockedPlugin;
      const disabled = disabledPlugins.includes(key) || blockedInCollaboration;
      const injectByDefault = DEFAULT_INJECT_PLUGINS.includes(key) && !disabled;
      const title = messages[`plugins.${pluginName}.title`] ? msg(`plugins.${pluginName}.title`) : key;
      const notice = blockedInCollaboration
        ? intl.formatMessage({ id: "plugins.editorOptimization.disabledInCollaboration" }, { plugin: title })
        : null;
      const pluginSetting: PluginSetting = {
        key: pluginName,
        label: title,
        type: "switch",
        // Must match what is actually running, otherwise restoring a saved
        // `true` is seen as a change and reaches onChange for a loaded plugin.
        value: injectByDefault,
        disabled,
        tags: pluginsManifest[key].credits || [],
        description:
          notice || (messages[`plugins.${pluginName}.description`] ? msg(`plugins.${pluginName}.description`) : null),
        onChange: (value: boolean, cancelChange: () => void) => {
          if (disabled) {
            // Cancel the restore for this project without saving over the user's preference.
            cancelChange();
            if (value && notice && teamworkManager) {
              showCollaborationNotice(teamworkManager.userInfo.clientId, notice);
            }
            return;
          }
          setPluginEnabled(key, value);
        },
      };
      if (injectByDefault) {
        setPluginEnabled(key, true);
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
  }, [registerSettings, msg, intl, disabledPlugins, collaborationBlockedPlugin, teamworkManager, setPluginEnabled]);

  return <Toaster />;
};

PluginsManager.displayName = "PluginsManager";

export default PluginsManager;
