import * as React from "react";
import * as ReactDOM from "react-dom/client";
import pluginsL10n from "src/plugins-l10n";
import PluginComponent from "./index";
import { createIntl, createIntlCache } from "@formatjs/intl";

const pluginName = "plugin";

window.Scratch.plugins.register((context) => {
  const div = document.createElement("div");
  div.setAttribute("data-plugin-name", pluginName);

  const pluginsWrapper = document.body.querySelector("#gandi-plugins-wrapper");
  pluginsWrapper.appendChild(div);
  const Plugin = React.createElement(PluginComponent, {
    ...context,
    intl: createIntl(
      {
        locale: context.intl.locale,
        messages: pluginsL10n[context.intl.locale],
      },
      createIntlCache(),
    ),
  });
  const root = ReactDOM.createRoot(div);
  root.render(Plugin);

  return {
    dispose: () => {
      root.unmount();
      pluginsWrapper.removeChild(div);
    },
  };
}, pluginName);
