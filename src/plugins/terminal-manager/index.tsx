import * as React from "react";
import * as ReactDOM from "react-dom";
import { defineMessages } from "@formatjs/intl";
import Tooltip from "components/Tooltip";
import { hotkeyIsDown, transitionHotkeysToString } from "utils/hotkey-helper";

import TerminalManagerIcon from "assets/icon--terminal-manager.svg";
import styles from "./styles.less";
import ExtensionBox, { ExpansionRect } from "components/ExpansionBox";
import useStorageInfo from "hooks/useStorageInfo";
import Switch from "components/Switch";

type LogType = "log" | "warn" | "error" | "info";

type ConfigType = "excepted" | "included";

interface Config {
  type: ConfigType;
  selectedFields: string[];
  selectedLogTypes: LogType[];
}

interface StringWithSplitLogTypeArray {
  split: (arg0: string) => LogType[];
}

const messages = defineMessages({
  title: {
    id: "plugins.terminalManager.title",
    defaultMessage: "TerminalManager",
    description: "TerminalManager title",
  },
  intro: {
    id: "plugins.terminalManager.intro",
    defaultMessage: "TerminalManager",
    description: "TerminalManager intro",
  },
  type: {
    id: "plugins.terminalManager.type",
    defaultMessage: "TerminalManager",
    description: "TerminalManager type",
  },
});

const DEFAULT_SETTINGS = {
  hotkeys: {
    visible: ["altKey", "M"],
  },
};

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

const DEFAULT_CONFIG: Config = {
  type: "excepted",
  selectedFields: ["MMO"],
  selectedLogTypes: ["warn"],
};

const TerminalManager: React.FC<PluginContext> = ({ intl, registerSettings, vm }) => {
  const [visible, setVisible] = React.useState(false);
  const [shortcutKey, setShortcutKey] = React.useState(DEFAULT_SETTINGS.hotkeys.visible);
  const [containerInfo, setContainerInfo] = useStorageInfo("TERMINAL_MANAGER_CONTAINER_INFO", DEFAULT_CONTAINER_INFO);
  const [config, setConfig] = useStorageInfo("TERMINAL_MANAGER_CONFIG", DEFAULT_CONFIG);
  const containerRef = React.useRef(null);
  const containerInfoRef = React.useRef(containerInfo);
  const rootRef = React.useRef(null);
  const [type, setType] = React.useState(config.type === "included");
  const [fields, setFields] = React.useState(config.selectedFields);
  const [logTypes, setLogTypes] = React.useState(config.selectedLogTypes);

  const _warn = vm.runtime.logSystem.warn;
  const _error = vm.runtime.logSystem.error;
  const _info = vm.runtime.logSystem.info;
  const _log = vm.runtime.logSystem.log;

  const handleHack = () => {
    Object.entries({
      log: _log,
      info: _info,
      warn: _warn,
      error: _error,
    }).forEach(([name, fn]: [LogType, (message?: unknown, ...optionalParams: unknown[]) => void]) => {
      const _fn = fn;
      fn = (message, ...optionalParams) => {
        switch (typeof message) {
          case "object":
            message = JSON.stringify(message);
            break;
          default:
            message = String(message);
        }
        let _check = false;
        config.selectedFields.forEach((field) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          message?.includes(field) && (_check = true);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          !message?.includes(field) && (_check = false);
        });

        if (
          config.type === "excepted"
            ? config.selectedLogTypes.includes(name) && _check
            : config.selectedLogTypes.includes(name) && !_check
        )
          return;
        _fn(message, ...optionalParams);
      };
      vm.runtime.logSystem[name] = fn;
    });
  };

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
    handleHack();
  }, []);

  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
    setContainerInfo(value);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTypeChange = React.useCallback((checked: boolean) => {
    setType(checked);
    setConfig(
      Object.assign({}, config, {
        type: checked ? "included" : "excepted",
      }),
    );
  }, []);

  const handleFieldsChange = (e: React.ChangeEvent) => {
    const value = (e.target as HTMLInputElement).value;
    setFields(value.split(","));
    setConfig(
      Object.assign({}, config, {
        selectedFields: value.split(","),
      }),
    );
  };

  const handleLogTypesChange = (e: React.ChangeEvent) => {
    const value = (e.target as HTMLInputElement).value as StringWithSplitLogTypeArray;
    setLogTypes(value.split(","));
    setConfig(
      Object.assign({}, config, {
        selectedLogTypes: value.split(","),
      }),
    );
  };

  React.useEffect(() => {
    if (shortcutKey.length) {
      const handler = (e: KeyboardEvent) => {
        if (!rootRef.current.getBoundingClientRect().x) return;
        if (hotkeyIsDown(shortcutKey, e)) {
          e.preventDefault();
          handleShow();
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
    const register = registerSettings(intl.formatMessage(messages.title), "plugin-terminal-manager", [
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

  handleHack();

  return ReactDOM.createPortal(
    <section className={styles.terminalManagerRoot} ref={rootRef}>
      <Tooltip
        className={styles.searchIcon}
        icon={<TerminalManagerIcon />}
        onClick={handleShow}
        tipText={intl.formatMessage(messages.intro)}
        shortcutKey={transitionHotkeysToString(shortcutKey)}
      />
      {visible &&
        ReactDOM.createPortal(
          <ExtensionBox
            ref={containerRef}
            stayOnTop
            title={intl.formatMessage(messages.title)}
            id="plugin-terminal-manager"
            minWidth={300}
            minHeight={450}
            borderRadius={8}
            onClose={handleClose}
            onSizeChange={handleSizeChange}
            containerInfo={containerInfo}
          >
            <div className={styles.containerBody}>
              <div className={styles.formContent}>
                <a className={styles.formLabel}>{intl.formatMessage(messages.type)}</a>
                <Switch onChange={handleTypeChange} checked={type} />
              </div>
              <br />
              <input type="input" value={fields} onChange={handleFieldsChange} />
              <br />
              <input type="input" value={logTypes} onChange={handleLogTypesChange} />
            </div>
          </ExtensionBox>,
          document.body,
        )}
    </section>,
    document.querySelector(".plugins-wrapper"),
  );
};

TerminalManager.displayName = "TerminalManagerPlugin";

export default TerminalManager;
