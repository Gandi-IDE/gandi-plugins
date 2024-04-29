import * as React from "react";
import toast from "react-hot-toast";
import CustomPluginIcon from "assets/icon--custom-plugin.svg";

const CustomPlugin = ({ msg, registerSettings }: PluginContext) => {
  const customPluginScript = React.useRef<HTMLScriptElement>(null);
  const inputElement = React.useRef<HTMLInputElement>(null);

  const loadPluginURL = React.useCallback((url: string) => {
    if (!url) return;

    if (/^(https?|ftp|):\/\/[^\s\/$.?#].[^\s]*\.js$/.test(url)) {
      if (customPluginScript.current) {
        document.body.removeChild(customPluginScript.current);
      }
      customPluginScript.current = document.createElement("script");
      customPluginScript.current.src = url;
      document.body.appendChild(customPluginScript.current);
    } else {
      toast.error(msg("plugins.pluginsManager.customPlugin.invalidLink"));
    }
  }, []);

  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.customPlugin.title"),
      "custom-plugin",
      [
        {
          key: "customPlugin",
          label: msg("plugins.customPlugin.title"),
          // description: msg("plugins.pluginsManager.description"),
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
                  loadPluginURL(e.target.value);
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
                        const script = document.createElement("script");
                        script.onload = () => {
                          resolve();
                        };
                        script.onerror = (error) => {
                          console.error(`Script file loading failed: ${error}`);
                          reject();
                        };
                        script.src = reader.result as string;
                        document.body.appendChild(script);
                      };
                      reader.onerror = () => {
                        console.error(`Could not read plugin as data URL: ${reader.error}`);
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
      register.dispose();
    };
  }, []);

  return null;
};

export default CustomPlugin;
