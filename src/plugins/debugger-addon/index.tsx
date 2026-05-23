import * as React from "react";
import * as ReactDOM from "react-dom";
import DebuggerIcon from "assets/icon--debugger.svg";
import ToolTip from "components/Tooltip";
import ExpansionBox from "components/ExpansionBox";
import style from "./styles.less";
import { ConsoleButton, ConsoleWindow } from "./Console";
import { PerformanceButton, PerformanceWindow } from "./Performance";
import Anser from "anser";

const pluginsWrapper = document.querySelector(".plugins-wrapper")!;
export type WindowContext = PluginContext & {
  Console: {
    maxLines: number;
    disableOrigin: boolean;
    logs: ConsoleLine[];
    clean(): void;
  };
};
export type ConsoleLine = { msg: string; count: number; target: Scratch.RenderTarget; block: string };

function isSameLine(line1: ConsoleLine, line2: ConsoleLine) {
  return line1.msg == line2.msg && line1.block == line2.block && line1.target == line2.target;
}

const NavWindow: React.FC<{ items: [React.ReactNode, React.ReactNode][] }> = ({ items }) => {
  const [pageId, setPageId] = React.useState(0);
  return (
    <>
      <nav>
        {items.map(([button], id) => {
          return (
            <button
              onClick={() => {
                setPageId(id);
              }}
              key={"button-" + id}
              className={style.navButton}
              data-active={pageId == id}
            >
              {button}
            </button>
          );
        })}
      </nav>
      {items[pageId][1]}
    </>
  );
};

const MainWindow: React.FC<{
  onClose(): void;
  context: WindowContext;
}> = ({ context, onClose }) => {
  const { msg, vm } = context;
  React.useEffect(() => {
    console.log(vm);
    vm.extensionManager.loadExtensionURL("GandiTerminal");
  }, [context]);
  const [containerInfo, setContainerInfo] = React.useState({ width: 400, height: 300, translateX: 80, translateY: 80 });

  const pages: [React.ReactNode, React.ReactNode][] = [
    [
      <ConsoleButton label={msg("plugins.debuggerAddon.performance")} key="console-button" />,
      <ConsoleWindow key="console-window" context={context} />,
    ],
    [
      <PerformanceButton label={msg("plugins.debuggerAddon.console")} key="performance-button" />,
      <PerformanceWindow key="performance-window" context={context} />,
    ],
  ];

  return (
    <ExpansionBox
      title={msg("plugins.debuggerAddon.title")}
      id="debuggerAddon"
      minHeight={300}
      minWidth={400}
      borderRadius={8}
      containerInfo={containerInfo}
      onClose={onClose}
      onSizeChange={() => setContainerInfo(containerInfo)}
      stayOnTop
      className={style.overflowHidden}
    >
      <NavWindow items={pages} />
    </ExpansionBox>
  );
};

function escape(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const DebuggerAddon: React.FC<PluginContext> = (context) => {
  const { registerSettings, msg, vm } = context;
  const [visible, setVisible] = React.useState(false);
  const [maxLines, setMaxLines] = React.useState(1000);
  const [disableOrigin, setDisableOrigin] = React.useState(false);

  const animationRef = React.useRef<number | null>(null);
  const incomingLines = React.useRef<ConsoleLine[]>([]);
  const pushLine = (str: string, target: Scratch.RenderTarget, block: string) => {
    const lastLine = incomingLines.current.at(-1);
    const newLine: ConsoleLine = {
      msg: Anser.ansiToHtml(escape(str)),
      count: 1,
      target,
      block,
    };
    if (lastLine && isSameLine(lastLine, newLine)) {
      lastLine.count += 1;
    } else {
      incomingLines.current.push(newLine);
    }
    if (animationRef.current == null) {
      animationRef.current = requestAnimationFrame(flushLines);
    }
  };
  const [logs, setLogs] = React.useState<ConsoleLine[]>([]);
  function flushLines() {
    const newLines = incomingLines.current;
    incomingLines.current = [];
    animationRef.current = null;
    setLogs((logs) => {
      const lastLine = logs.at(-1);
      if (newLines.length == 0) {
        return logs;
      }
      const firstLine = newLines[0];
      if (lastLine && isSameLine(lastLine, firstLine)) {
        return [
          ...logs.slice(0, -1),
          Object.assign(lastLine, { count: lastLine.count + firstLine.count }),
          ...newLines.slice(1),
        ];
      }
      return [...logs, ...newLines];
    });
  }
  const handleMessage = React.useCallback((msg: unknown) => {
    const { activeThread } = vm.runtime.sequencer;
    const { target } = activeThread;
    const blockId = activeThread.peekStack();
    requestAnimationFrame(() => pushLine(String(msg), target, blockId));
  }, []);
  const clean = React.useCallback(() => {
    setLogs([]);
  }, []);

  React.useEffect(() => {
    const { vm } = context;
    const { logSystem } = vm.runtime;
    const { log, info, warn, error, clear } = logSystem;
    logSystem.log = function (msg, ...rest) {
      if (!disableOrigin) {
        log.call(this, msg, ...rest);
      }
      handleMessage(msg);
    };
    logSystem.info = function (msg, ...rest) {
      if (!disableOrigin) {
        info.call(this, msg, ...rest);
      }
      handleMessage(`\x1B[0;92m${msg}`);
    };
    logSystem.warn = function (msg, ...rest) {
      if (!disableOrigin) {
        warn.call(this, msg, ...rest);
      }
      handleMessage(`\x1B[0;93m${msg}`);
    };
    logSystem.error = function (msg, ...rest) {
      if (!disableOrigin) {
        error.call(this, msg, ...rest);
      }
      handleMessage(`\x1B[97;101m${msg}`);
    };
    logSystem.clear = function () {
      clear.call(this);
      setLogs([]);
      incomingLines.current = [];
    };
    return () => {
      logSystem.log = log;
      logSystem.info = info;
      logSystem.warn = warn;
      logSystem.error = error;
      logSystem.clear = clear;
      setLogs([]);
    };
  }, [vm, disableOrigin]);
  React.useEffect(() => {
    const { dispose } = registerSettings(msg("plugins.debuggerAddon.title"), "debugger-addon", [
      {
        key: "debuggerAddon",
        label: msg("plugins.debuggerAddon.title"),
        description: "abcd",
        items: [
          {
            type: "switch",
            value: disableOrigin,
            key: "disableOriginConsole",
            label: msg("plugins.debuggerAddon.console.disableOrigin"),
            onChange(v) {
              setDisableOrigin(!!v);
            },
          },
          {
            type: "input",
            value: maxLines,
            key: "maxLines",
            label: msg("plugins.debuggerAddon.console.maxLines"),
            inputProps: {
              type: "number",
            },
            onChange(v) {
              setMaxLines(Number(v));
            },
          },
        ],
      },
    ]);
    return () => {
      dispose();
    };
  }, [registerSettings]);
  return ReactDOM.createPortal(
    <section>
      <ToolTip
        icon={<DebuggerIcon />}
        tipText={msg("plugins.debuggerAddon.title")}
        className={style.icon}
        onClick={() => setVisible(true)}
      />
      {visible &&
        ReactDOM.createPortal(
          <MainWindow
            context={{ ...context, Console: { maxLines, disableOrigin, logs, clean } }}
            onClose={() => {
              setVisible(false);
            }}
          />,
          document.body,
        )}
    </section>,
    pluginsWrapper,
  );
};

DebuggerAddon.displayName = "DebuggerAddon";

export default DebuggerAddon;
