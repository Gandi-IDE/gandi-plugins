import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { noop } from "lodash-es";
import PluginsManager from "plugins/plugins-manager";
import pluginsManifest from "./plugins-manifest";
import pluginsEntry from "./plugins-entry";
import pluginsL10n from "./plugins-l10n";
import { createIntl, createIntlCache } from "@formatjs/intl";
import { IntlShape } from "react-intl";
import { camelToKebab } from "utils/name-helper";

import PluginOperations from "./plugin-operations";
import PluginMount from "./plugin-mount";

interface PluginComponent extends React.FunctionComponent<PluginContext> {
  displayName: string;
}

interface PluginInstance {
  dispose?(): void | Promise<void>;
}

export interface PluginFunction {
  (context: PluginContext): PluginInstance;
}

export interface PluginsControllerOptions extends Omit<PluginContext, "intl" | "msg"> {
  disabledPlugins?: Array<string>;
  unavailablePlugins?: string[];
  locale: string;
}

class PluginsController {
  context: PluginContext;
  plugins: Record<string, () => void | Promise<void>>;
  operations: PluginOperations;
  private mounting = new Map<string, () => void>();
  options: PluginsControllerOptions;
  pluginsManager?: {
    dispose: () => void;
  };
  wrapperElement: HTMLElement;
  /**
   * Creates an instance of PluginsController.
   * @param {PluginsControllerOptions} options - Options for initializing the controller.
   */
  constructor(options: PluginsControllerOptions) {
    this.plugins = {};
    this.operations = new PluginOperations(async (name, enabled) => {
      if (enabled) {
        if (this.plugins[name]) return;
        const { default: plugin } = await pluginsEntry[name]();
        if (!this.context) throw new Error("Plugin controller has been disposed");
        await this.injectPlugin(plugin, pluginsManifest[name].type, name);
      } else if (this.plugins[name]) {
        await this.plugins[name]();
        delete this.plugins[name];
      }
    });
    const intl = this.createIntl(options.locale);
    this.context = Object.assign(options, {
      intl,
      msg: (id: string) => intl.formatMessage({ id }),
    });
    this.options = options;
    this.wrapperElement = this.initWrapper();
    this.initPluginsManager();
  }

  /**
   * Initializes the wrapper element.
   * @returns {HTMLElement} The wrapper element.
   */
  initWrapper(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.id = "gandi-plugins-wrapper";
    document.body.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Initializes the plugins manager.
   */
  initPluginsManager() {
    const div = document.createElement("div");
    div.setAttribute("data-plugin-name", "plugins-manager");
    this.wrapperElement.appendChild(div);

    const { disabledPlugins = [], unavailablePlugins = [] } = this.options;
    const PluginsManagerComponent = React.createElement(PluginsManager, {
      ...this.context,
      disabledPlugins: disabledPlugins.concat(unavailablePlugins).map(camelToKebab),
      setPluginEnabled: this.operations.setEnabled.bind(this.operations),
    });
    const root = ReactDOM.createRoot(div);
    root.render(PluginsManagerComponent);
    this.pluginsManager = {
      dispose: () => {
        root.unmount();
        this.wrapperElement.removeChild(div);
      },
    };
  }

  /**
   * Creates an internationalization instance.
   * @param {string} locale - The locale.
   * @returns {IntlShape} The internationalization instance.
   */
  createIntl(locale: string): IntlShape {
    const defaultLocale = "en";
    const defaultMessages = pluginsL10n[defaultLocale];
    if (!pluginsL10n[locale]) {
      locale = defaultLocale;
    }
    const localeMessages = pluginsL10n[locale];
    const messages = locale === defaultLocale ? defaultMessages : { ...defaultMessages, ...localeMessages };
    return createIntl(
      {
        locale,
        messages,
      },
      createIntlCache(),
    );
  }

  /**
   * Injects a plugin into the wrapper element.
   * @param {PluginFunction | PluginComponent} plugin - The plugin to inject.
   * @param {string} type - The type of the plugin ('component' or 'function').
   * @param {string} pluginName - The name of the plugin.
   */
  async injectPlugin(plugin: PluginComponent | PluginFunction, type: string, pluginName: string) {
    if (type === "component") {
      const div = document.createElement("div");
      div.setAttribute("data-plugin-name", pluginName);
      this.wrapperElement.appendChild(div);
      const root = ReactDOM.createRoot(div);
      const dispose = () => {
        root.unmount();
        div.remove();
      };
      try {
        await new Promise<void>((resolve, reject) => {
          this.mounting.set(pluginName, () => reject(new Error("Plugin controller has been disposed")));
          root.render(
            React.createElement(
              PluginMount,
              {
                onReady: resolve,
                onError: reject,
              },
              React.createElement(plugin as PluginComponent, this.context),
            ),
          );
        });
        if (!this.context) throw new Error("Plugin controller has been disposed");
        this.plugins[pluginName] = dispose;
      } catch (error) {
        dispose();
        throw error;
      } finally {
        this.mounting.delete(pluginName);
      }
    } else if (type === "function") {
      const instance = await (plugin as PluginFunction)(this.context);
      const dispose = instance?.dispose || noop;
      if (!this.context) {
        await dispose();
        throw new Error("Plugin controller has been disposed");
      }
      this.plugins[pluginName] = dispose;
    }
  }

  /**
   * Loads and injects a plugin into the wrapper element.
   * @param {string} pluginName - The name of the plugin to load and inject.
   */
  loadAndInjectPlugin(pluginName: string) {
    return this.operations.setEnabled(pluginName, true);
  }

  /**
   * Disposes the controller and cleans up resources.
   */
  dispose() {
    this.context = null;
    this.operations.dispose();
    this.mounting.forEach((cancel) => cancel());
    this.mounting.clear();
    for (const key in this.plugins) {
      if (Object.prototype.hasOwnProperty.call(this.plugins, key)) {
        try {
          Promise.resolve(this.plugins[key]()).catch((error) => console.error("Plugin cleanup failed", error));
        } catch (error) {
          console.error("Plugin cleanup failed", error);
        }
      }
    }
    this.pluginsManager?.dispose();
    document.body.removeChild(this.wrapperElement);
    this.wrapperElement = null;
    this.plugins = {};
    this.context = null;
  }
}

export default PluginsController;
