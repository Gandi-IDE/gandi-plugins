import * as React from "react";
import * as ReactDOM from "react-dom";
import { defineMessages } from "@formatjs/intl";
import { useDevToolsContext } from "src/plugins/dev-tools/lib/context";
import Tooltip from "components/Tooltip";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import { hotkeyIsDown, transitionHotkeysToString } from "utils/hotkey-helper";
import useStorageInfo from "hooks/useStorageInfo";

import DevToolsIcon from "assets/icon--dev-tools.svg";
import styles from "./styles.less";

const messages = defineMessages({
  title: {
    id: "plugins.devTools.title",
    defaultMessage: "DevTools",
    description: "DevTools title",
  },
});

const DEFAULT_SETTINGS = {
  hotkeys: {
    visible: ["ctrlKey", "I"],
  },
};

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

const DevToolsPluginEntrance: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { intl, registerSettings, trackEvents } = useDevToolsContext();
  const [visible, setVisible] = React.useState(false);
  const [shortcutKey, setShortcutKey] = React.useState(DEFAULT_SETTINGS.hotkeys.visible);
  const [containerInfo, setContainerInfo] = useStorageInfo("DEV_TOOLS_CONTAINER_INFO", DEFAULT_CONTAINER_INFO);

  const rootRef = React.useRef(null);
  const containerInfoRef = React.useRef(containerInfo);

  const getContainerPosition = React.useCallback(() => {
    const { x, y } = rootRef.current.getBoundingClientRect();
    return {
      translateX: x - containerInfoRef.current.width - 10,
      translateY: y - 6,
    };
  }, []);

  const handleShow = React.useCallback(() => {
    setContainerInfo({
      ...containerInfoRef.current,
      ...getContainerPosition(),
    });
    setVisible(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setVisible(false);
  }, []);

  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
    setContainerInfo(value);
  }, []);

  React.useEffect(() => {
    if (shortcutKey.length) {
      const handler = (e: KeyboardEvent) => {
        if (!rootRef.current.getBoundingClientRect().x) return;
        if (hotkeyIsDown(shortcutKey, e)) {
          e.preventDefault();
          setContainerInfo({
            ...containerInfoRef.current,
            ...getContainerPosition(),
          });
          setVisible((pre) => !pre);
        }
      };
      window.addEventListener("keydown", handler);
      return () => {
        window.removeEventListener("keydown", handler);
      };
    }
  }, [shortcutKey]);

  React.useEffect(() => {
    const register = registerSettings(intl.formatMessage(messages.title), "plugin-dev-tools", [
      {
        key: "hotkeys",
        label: "快捷键",
        items: [
          {
            key: "visible",
            type: "hotkey",
            label: intl.formatMessage(messages.title),
            value: shortcutKey,
            onChange: (value: Array<string>) => {
              setShortcutKey(value);
            },
          },
        ],
      },
    ]);
    return () => {
      register.dispose();
    };
  }, [registerSettings]);

  React.useEffect(() => {
    if (visible) {
      trackEvents.dispatch(trackEvents.USE_ADDON, {
        searchType: "debug_tools",
      });
      const heartbeat = trackEvents.heartbeatEvents(trackEvents.USING_ADDON_HEARTBEAT, {
        pluginType: "debug_tools",
      });
      return () => {
        heartbeat.dispose();
      };
    }
  }, [visible]);

  return ReactDOM.createPortal(
    <section className={styles.devTools} ref={rootRef}>
      <Tooltip
        className={styles.searchIcon}
        icon={<DevToolsIcon />}
        onClick={handleShow}
        tipText={intl.formatMessage(messages.title)}
        shortcutKey={transitionHotkeysToString(shortcutKey)}
      />
      {visible
        ? ReactDOM.createPortal(
            <ExpansionBox
              title={intl.formatMessage(messages.title)}
              id="plugin-blocks-search"
              stayOnTop
              minWidth={300}
              minHeight={450}
              borderRadius={8}
              onClose={handleClose}
              onSizeChange={handleSizeChange}
              containerInfo={containerInfo}
            >
              {children}
            </ExpansionBox>,
            document.body,
          )
        : null}
    </section>,
    document.querySelector(".plugins-wrapper"),
  );
};

DevToolsPluginEntrance.displayName = "DevToolsPluginEntrance";

export default DevToolsPluginEntrance;
