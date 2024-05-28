import React, { useEffect } from "react";
import * as ReactDOM from "react-dom/client";
import PluginsController from "./plugins-controller";

const App = () => {
  const pluginsController = React.useRef<typeof PluginsController>();
  const initd = React.useRef<boolean>(false);
  const initTimeout = React.useRef<NodeJS.Timeout | null | number>(1);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleInit = React.useCallback(() => {
    iframeRef.current.contentWindow.postMessage({ name: "plugins-inject", path: location.origin + "/main.js" }, "*");
    if (!initd.current) {
      initTimeout.current = setTimeout(handleInit, 3000);
    }
  }, []);

  React.useEffect(() => {
    const onMessage = (event) => {
      if (event.data && event.data.name === "plugins-inject-success") {
        initd.current = true;
        if (initTimeout.current) {
          clearTimeout(initTimeout.current);
          initTimeout.current = null;
        }
      }
      if (event.data && event.data.name === "plugins-unmounted") {
        initd.current = false;
        handleInit();
      }
    };
    window.addEventListener("message", onMessage, false);
    return () => {
      window.removeEventListener("message", onMessage, false);
    };
  }, [handleInit]);

  useEffect(() => {
    pluginsController.current = PluginsController;
    setTimeout(handleInit, 1000);
  }, [handleInit]);

  return <iframe ref={iframeRef} id="gandi-wrapper" src={process.env.SITE_SRC}></iframe>;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
