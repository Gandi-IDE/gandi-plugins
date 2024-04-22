import * as React from "react";
import * as ReactDOM from "react-dom";
import { defineMessages } from "@formatjs/intl";
import Tooltip from "components/Tooltip";
import { hotkeyIsDown, transitionHotkeysToString } from "utils/hotkey-helper";
import { isMac } from "lib/client-info";

import TerminalIcon from "assets/icon--terminal.svg";
import styles from "./styles.less";

const messages = defineMessages({
  title: {
    id: "plugins.terminal.title",
    defaultMessage: "Terminal",
    description: "Terminal title",
  },
});

const DEFAULT_SETTINGS = {
  hotkeys: {
    visible: {
      keys: ["altKey", "T"],
      stringKeys: [isMac ? "Option" : "Alt", "T"],
    },
  },
};

const Terminal: React.FC<PluginContext> = ({ intl, vm, registerSettings, trackEvents }) => {
  const [shortcutKey, setShortcutKey] = React.useState(DEFAULT_SETTINGS.hotkeys.visible);

  const rootRef = React.useRef(null);

  const handleShow = React.useCallback(() => {
    trackEvents.dispatch(trackEvents.USE_ADDON, {
      searchType: "terminal",
    });
    vm.runtime.logSystem.show();
  }, [vm]);

  React.useEffect(() => {
    if (shortcutKey.keys.length) {
      const handler = (e: KeyboardEvent) => {
        if (!rootRef.current.getBoundingClientRect().x) return;
        if (hotkeyIsDown(shortcutKey.keys, e)) {
          e.preventDefault();
          handleShow();
        }
      };
      window.addEventListener("keydown", handler);
      return () => {
        window.removeEventListener("keydown", handler);
      };
    }
  }, [shortcutKey]);

  React.useEffect(() => {
    const register = registerSettings(intl.formatMessage(messages.title), "plugin-terminal", [
      {
        key: "hotkeys",
        label: "快捷键",
        items: [
          {
            key: "visible",
            type: "hotkey",
            label: intl.formatMessage(messages.title),
            value: shortcutKey,
            onChange: (value) => {
              setShortcutKey(
                value as {
                  keys: string[];
                  stringKeys: string[];
                },
              );
            },
          },
        ],
      },
    ]);
    return () => {
      register.dispose();
    };
  }, [registerSettings]);

  return ReactDOM.createPortal(
    <section className={styles.terminalRoot} ref={rootRef}>
      <Tooltip
        className={styles.searchIcon}
        icon={<TerminalIcon />}
        onClick={handleShow}
        tipText={intl.formatMessage(messages.title)}
        shortcutKey={transitionHotkeysToString(shortcutKey.keys)}
      />
    </section>,
    document.querySelector(".plugins-wrapper"),
  );
};

Terminal.displayName = "TerminalPlugin";

export default Terminal;
