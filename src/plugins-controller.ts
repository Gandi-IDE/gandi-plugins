import * as React from "react";
import * as ReactDOM from "react-dom/client";
import PluginsManager from "plugins/plugins-manager";
import pluginsManifest from "./plugins-manifest";
import pluginsEntry from "./plugins-entry";
import pluginsL10n from "./plugins-l10n";
import { createIntl, createIntlCache } from "@formatjs/intl";
import { IntlShape } from "react-intl";
import { noop } from "lodash-es";

export const LoadingPlugins = {};

interface PluginComponent extends React.FunctionComponent<PluginContext> {
  displayName: string;
}

export interface PluginFunction {
  (context: PluginContext): {
    dispose?(): void;
  };
}

export interface PluginsControllerOptions extends Omit<PluginContext, "intl" | "msg"> {
  disabledPlugins?: Array<string>;
  unavailablePlugins?: string[];
  locale: string;
}

class PluginsController {
  context: PluginContext;
  plugins: Record<string, () => void>;
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
    const PluginsManagerComponent = React.createElement(PluginsManager, {
      ...this.context,
      disabledPlugins: this.options.disabledPlugins,
      unavailablePlugins: this.options.unavailablePlugins || [],
      loadAndInjectPlugin: this.loadAndInjectPlugin.bind(this),
      plugins: this.plugins,
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
    // If the language is not supported yet, it will default to displaying English.
    if (!pluginsL10n[locale]) {
      locale = "en";
    }
    return createIntl(
      {
        locale,
        messages: pluginsL10n[locale],
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
  injectPlugin(plugin: PluginComponent | PluginFunction, type: string, pluginName: string) {
    if (type === "component") {
      const div = document.createElement("div");
      div.setAttribute("data-plugin-name", pluginName);
      this.wrapperElement.appendChild(div);
      const Plugin = React.createElement(plugin as PluginComponent, this.context);
      const root = ReactDOM.createRoot(div);
      root.render(Plugin);
      this.plugins[pluginName] = () => {
        root.unmount();
        this.wrapperElement.removeChild(div);
      };
    } else if (type === "function") {
      const instance = (plugin as PluginFunction)(this.context);
      this.plugins[pluginName] = instance?.dispose || noop;
    }
  }

  /**
   * Loads and injects a plugin into the wrapper element.
   * @param {string} pluginName - The name of the plugin to load and inject.
   */
  loadAndInjectPlugin(pluginName: string) {
    let cancelled = false;
    const manifest = pluginsManifest[pluginName];
    pluginsEntry[pluginName]().then(({ default: plugin }) => {
      delete LoadingPlugins[pluginName];
      if (cancelled) {
        delete LoadingPlugins[pluginName];
        return;
      }
      if (this.context) {
        this.injectPlugin(plugin, manifest.type, pluginName);
      }
    });
    LoadingPlugins[pluginName] = () => {
      cancelled = true;
    };
  }

  /**
   * Disposes the controller and cleans up resources.
   */
  dispose() {
    for (const key in this.plugins) {
      if (Object.prototype.hasOwnProperty.call(this.plugins, key)) {
        this.plugins[key]();
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
