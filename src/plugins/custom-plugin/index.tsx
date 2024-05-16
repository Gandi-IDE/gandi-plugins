import * as React from "react";
import { noop } from "lodash-es";
import toast from "react-hot-toast";
import CustomPluginIcon from "assets/icon--custom-plugin.svg";
import type { PluginFunction } from "src/plugins-controller";

const CustomPlugin = (context: PluginContext) => {
  const { msg, registerSettings } = context;
  const customPluginScript = React.useRef<HTMLScriptElement>(null);
  const inputElement = React.useRef<HTMLInputElement>(null);
  const customPlugins = React.useRef<ReturnType<PluginFunction>>({});

  const setPluginRegisterToWindow = React.useCallback((loadSuccess: () => void) => {
    if (!window.Scratch) window.Scratch = {};
    if (!window.Scratch.plugins) window.Scratch.plugins = {};
    const removePluginRegisterFromWindow = () => {
      // Remove the plugin register
      delete window.Scratch.plugins;
      if (Object.keys(window.Scratch).length === 0) {
        delete window.Scratch;
      }
    };
    window.Scratch.plugins.register = (plugin: PluginFunction, pluginName = "unknown-plugin") => {
      const instance = plugin(context);
      if (customPlugins.current[pluginName]) {
        customPlugins.current[pluginName]();
        delete customPlugins.current[pluginName];
      }
      customPlugins.current[pluginName] = instance?.dispose || noop;
      removePluginRegisterFromWindow();
      loadSuccess();
    };
    return removePluginRegisterFromWindow;
  }, []);

  const useScriptTagLoadPlugin = React.useCallback((url: string, loadSuccess: () => void, loadFailed: () => void) => {
    if (customPluginScript.current) {
      document.body.removeChild(customPluginScript.current);
    }
    customPluginScript.current = document.createElement("script");
    customPluginScript.current.src = url;
    const removePluginRegisterFromWindow = setPluginRegisterToWindow(loadSuccess);
    customPluginScript.current.onerror = (error) => {
      console.error(`Script file loading failed: ${error}`);
      removePluginRegisterFromWindow();
      loadFailed();
    };
    document.body.appendChild(customPluginScript.current);
  }, []);

  const loadPluginFromURL = React.useCallback(
    (url: string) => {
      if (!url) return;
      const pluginLoadPromise = new Promise<void>((resolve, reject) => {
        if (/^(https?|ftp|):\/\/[^\s\/$.?#].[^\s]*\.js$/.test(url)) {
          useScriptTagLoadPlugin(url, resolve, reject);
        } else {
          toast.error(msg("plugins.pluginsManager.customPlugin.invalidLink"));
          reject();
        }
      });
      toast.promise(pluginLoadPromise, {
        loading: msg("plugins.customPlugin.loading"),
        success: msg("plugins.customPlugin.loadSuccess"),
        error: msg("plugins.customPlugin.loadFailed"),
      });
    },
    [context],
  );

  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.customPlugin.title"),
      "custom-plugin",
      [
        {
          key: "customPlugin",
          label: msg("plugins.customPlugin.title"),
          items: [
            {
              key: "pluginFileUrl",
              label: msg("plugins.customPlugin.promptURL"),
              type: "input",
              description: msg("plugins.customPlugin.promptUrlDescription"),
              inputProps: {
                placeholder: "https://m.ccw.site/plugins/...",
                onPressEnter: (e) => {
                  (e.target as HTMLInputElement).blur();
                },
                onBlur: (e) => {
                  loadPluginFromURL(e.target.value);
                },
              },
              value: "",
              autoSave: false,
            },
            {
              key: "pluginFile",
              label: msg("plugins.customPlugin.loadFromLocal"),
              type: "input",
              inputProps: {
                type: "file",
                onFocus: (e) => {
                  inputElement.current = e.target;
                },
                onBlur: () => {
                  inputElement.current = null;
                },
              },
              onChange: () => {
                if (inputElement.current && inputElement.current.files) {
                  const file = inputElement.current.files[0];
                  if (file) {
                    const pluginLoadPromise = new Promise<void>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        useScriptTagLoadPlugin(reader.result as string, resolve, reject);
                      };
                      reader.onerror = () => {
                        console.error(`Could not read plugin as data URL: ${reader.error}`);
                        reject();
                      };
                      reader.readAsDataURL(file);
                    });
                    toast.promise(pluginLoadPromise, {
                      loading: msg("plugins.customPlugin.loading"),
                      success: msg("plugins.customPlugin.loadSuccess"),
                      error: msg("plugins.customPlugin.loadFailed"),
                    });
                  }
                }
              },
              value: "",
              autoSave: false,
            },
          ],
        },
      ],
      <CustomPluginIcon />,
    );

    return () => {
      const pluginNames = Object.keys(customPlugins.current);
      pluginNames.forEach((name) => {
        customPlugins.current[name]();
      });
      register.dispose();
    };
  }, []);

  return null;
};

export default CustomPlugin;
