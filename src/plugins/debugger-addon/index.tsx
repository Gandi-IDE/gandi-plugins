import * as React from "react";
import * as ReactDOM from "react-dom";
import DebuggerIcon from "assets/icon--debugger.svg";
import ToolTip from "components/Tooltip";
import ExpansionBox from "components/ExpansionBox";
import style from "./styles.less";
import { ConsoleButton, ConsoleWindow } from "./Console";
import { StatsButton, StatsWindow } from "./Stats";
import Anser from "anser";
import { getInnerText } from "./getCurrentBlocks";
import { PerformanceButton, PerformanceWindow, Record } from "./Performance";
import { ThreadsButton, ThreadsWindow } from "./Threads";

const pluginsWrapper = document.querySelector(".plugins-wrapper")!;
export type WindowContext = PluginContext & {
  Console: {
    console_maxLines: number;
    console_disableOrigin: boolean;
    logs: ConsoleLine[];
    clean(): void;
    transparentBg: boolean;
  };
  Stats: {
    stats_disableAnimation: boolean;
    transparentBg: boolean;
    statsData: {
      fps: number[];
      clones: number[];
      labels: number[];
    };
  };
  Performance: {
    performance_maxTime: number;
    performance_startTime: number;
    setPerformance_startTime: React.Dispatch<React.SetStateAction<number>>;
    performance_records: Record;
    setPerformance_records: React.Dispatch<React.SetStateAction<Record>>;
  };
  terminalLoadMode: string;
};
export type ConsoleLine = {
  msg: string;
  count: number;
  target: Scratch.RenderTarget | null;
  block: string;
  innerBlockText: string;
  innerBlockColor: string;
};

function isSameLine(line1: ConsoleLine, line2: ConsoleLine) {
  type keys = keyof ConsoleLine;
  const uniqueKeys: keys[] = ["msg", "innerBlockText", "target", "block"];
  for (let k of uniqueKeys) {
    if (line1[k] !== line2[k]) {
      return false;
    }
  }
  return true;
}

const NavWindow: React.FC<{ items: [React.ReactNode, React.ReactNode][] }> = ({ items }) => {
  const [pageId, setPageId] = React.useState(0);
  return (
    <>
      <nav className={style.topNav}>
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
  const { msg, vm, terminalLoadMode } = context;
  const [containerInfo, setContainerInfo] = React.useState({ width: 480, height: 320, translateX: 80, translateY: 80 });
  if (terminalLoadMode === 'onClick') vm.extensionManager.loadExternalExtensionById('GandiTerminal');

  const pages: [React.ReactNode, React.ReactNode][] = [
    [
      <ConsoleButton label={msg("plugins.debuggerAddon.console")} key="console-button" />,
      <ConsoleWindow key="console-window" context={context} />,
    ],
    [
      <StatsButton label={msg("plugins.debuggerAddon.stats")} key="stats-button" />,
      <StatsWindow key="stats-window" context={context} />,
    ],
    [
      <ThreadsButton label={msg("plugins.debuggerAddon.threads")} key="threads-button" />,
      <ThreadsWindow key="threads-window" context={context} />,
    ],
    [
      <PerformanceButton label={msg("plugins.debuggerAddon.performance")} />,
      <PerformanceWindow key="performance-window" context={context} />,
    ],
  ];

  return (
    <ExpansionBox
      title={msg("plugins.debuggerAddon.title")}
      id="debuggerAddon"
      minHeight={320}
      minWidth={480}
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
  const { registerSettings, msg, vm, blockly } = context;
  const [visible, setVisible] = React.useState(false);
  const [console_maxLines, setConsole_MaxLines] = React.useState(1000);
  const [console_disableOrigin, setConsole_DisableOrigin] = React.useState(false);

  const [stats_disableAnimation, setStats_DisableAnimation] = React.useState(true);

  const [performance_maxTime, setPerformance_maxTime] = React.useState(100);
  const [performance_startTime, setPerformance_startTime] = React.useState(0);
  const [performance_records, setPerformance_records] = React.useState<Record>({
    blockFunc: {},
    render: {
      count: 0,
      selfTime: 0,
      totalTime: 0,
    },
    execute: {
      count: 0,
      selfTime: 0,
      totalTime: 0,
    },
  });
  const [transparentBg, setTransparentBg] = React.useState(true);
  const [terminalLoadMode, setTerminalLoadMode] = React.useState("auto");
  const statsDataRef = React.useRef<{
    fps: number[];
    clones: number[];
    labels: number[];
  }>({
    fps: new Array(20).fill(0),
    clones: new Array(20).fill(0),
    labels: Array.from({ length: 20 }, (_, i) => 19 - i),
  });
  React.useEffect(() => {
    const { runtime } = context.vm;
    let frameCount = 0;
    let lastTime = performance.now();
    
    const originalStep = runtime._step;
    runtime._step = function () {
      originalStep.call(this);
      frameCount++;
    };
    
    const interval = setInterval(() => {
      const data = statsDataRef.current;
      const now = performance.now();
      
      const fps = Math.round(frameCount);
      frameCount = 0;
      lastTime = now;
      
      const clones = runtime.targets.filter((t: any) => !t.isOriginal).length;
      
      data.fps.shift();
      data.fps.push(fps);
      data.clones.shift();
      data.clones.push(clones);
    }, 1000);
    
    return () => {
      runtime._step = originalStep;
      clearInterval(interval);
    };
  }, []);

  const throttleTimerRef = React.useRef<number | null>(null);
  const incomingLines = React.useRef<ConsoleLine[]>([]);
  const pushLine = React.useCallback(
    (str: string, target: Scratch.RenderTarget | null, block: string, innerBlockText: string, innerBlockColor = "") => {
      const lastLine = incomingLines.current.at(-1);
      const newLine: ConsoleLine = {
        msg: Anser.ansiToHtml(escape(str)),
        count: 1,
        target,
        innerBlockText,
        block,
        innerBlockColor,
      };
      if (lastLine && isSameLine(lastLine, newLine)) {
        lastLine.count += 1;
      } else {
        incomingLines.current.push(newLine);
      }
      // 统一使用节流延迟更新
      if (throttleTimerRef.current == null) {
        throttleTimerRef.current = window.setTimeout(() => {
          throttleTimerRef.current = null;
          flushLines();
        }, 100);
      }
    },
    [],
  );
  const [logs, setLogs] = React.useState<ConsoleLine[]>([]);
  const flushLines = React.useCallback(() => {
    const newLines = incomingLines.current;
    incomingLines.current = [];
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
  }, [logs]);
  const handleMessage = React.useCallback((msg: unknown) => {
    const { activeThread } = vm.runtime.sequencer;
    if (!activeThread) return void pushLine(`${msg}`, null, '', '');
    const { target } = activeThread;
    const { blocks } = target;
    const blockId = activeThread.peekStack();
    const block = blocks.getBlock(blockId);
    requestAnimationFrame(() => {
      const { innerBlockText, color } = getInnerText(block, blocks, blockly);
      pushLine(String(msg), target, blockId, innerBlockText, color);
    });
  }, []);
  const clean = React.useCallback(() => {
    setLogs([]);
  }, []);

  React.useEffect(() => {
    const { vm } = context;
    const { logSystem } = vm.runtime;
    const { log, info, warn, error, clear } = logSystem;
    const origin = { log, info, warn, error };
    const prefix = { log: "", info: "\x1B[0;92m", warn: "\x1B[0;93m", error: "\x1B[97;101m" };
    for (let key_ of Object.keys(origin)) {
      const key = key_ as keyof typeof origin;
      logSystem[key] = (...msgs) => {
        const msg = msgs.join(" ");
        if (!console_disableOrigin) {
          origin[key].call(logSystem, ...msgs);
        }
        handleMessage(`${prefix[key]}${msg}`);
      };
    }
    logSystem.clear = function () {
      clear.call(this);
      setLogs([]);
      incomingLines.current = [];
    };
    return () => {
      for (let key_ of Object.keys(origin)) {
        const key = key_ as keyof typeof origin;
        logSystem[key] = origin[key];
      }
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, [console_disableOrigin]);
  React.useEffect(() => {
    const { dispose } = registerSettings(
      msg("plugins.debuggerAddon.title"),
      "debugger-addon",
      [
        {
          key: "debuggerAddon",
          label: msg("plugins.debuggerAddon.title"),
          description: msg("plugins.debuggerAddon.description"),
          items: [
            {
              type: "select",
              value: terminalLoadMode,
              key: "terminalLoadMode",
              label: msg("plugins.debuggerAddon.terminalLoadMode"),
              description: msg("plugins.debuggerAddon.terminalLoadMode.d"),
              options: [
                { label: msg("plugins.debuggerAddon.terminalLoadMode.auto"), value: "auto" },
                { label: msg("plugins.debuggerAddon.terminalLoadMode.onClick"), value: "onClick" },
                { label: msg("plugins.debuggerAddon.terminalLoadMode.manual"), value: "manual" },
              ],
              onChange: v => setTerminalLoadMode(v as string),
            },
            {
              type: "switch",
              value: console_disableOrigin,
              key: "disableOriginConsole",
              label: msg("plugins.debuggerAddon.console.disableOrigin"),
              description: msg("plugins.debuggerAddon.console.disableOrigin.desc"),
              onChange(v) {
                setConsole_DisableOrigin(!!v);
              },
            },
            {
              type: "input",
              value: console_maxLines,
              key: "maxLines",
              label: msg("plugins.debuggerAddon.console.maxLines"),
              description: msg("plugins.debuggerAddon.console.maxLines.desc"),
              inputProps: {
                type: "number",
              },
              onChange(v) {
                setConsole_MaxLines(Number(v));
              },
            },
            {
              type: "switch",
              value: stats_disableAnimation,
              key: "disableAnimation",
              label: msg("plugins.debuggerAddon.stats.disableAnimation"),
              description: msg("plugins.debuggerAddon.stats.disableAnimation.desc"),
              onChange(v) {
                setStats_DisableAnimation(!!v);
              },
            },
            {
              type: "input",
              value: performance_maxTime,
              key: "maxTime",
              label: msg("plugins.debuggerAddon.performance.maxTime"),
              description: msg("plugins.debuggerAddon.performance.maxTime.d"),
              inputProps: {
                type: "number",
              },
              onChange(v) {
                setPerformance_maxTime(Number(v));
              },
            },
            {
              type: "switch",
              value: true,
              key: "transparent",
              label: msg("plugins.debuggerAddon.console.transparent"),
              description: msg("plugins.debuggerAddon.console.transparent.d"),
              onChange: v => setTransparentBg(v as boolean),
            },
          ],
        },
      ],
      <DebuggerIcon />,
    );
    terminalLoadMode === "auto" && vm.extensionManager.loadExternalExtensionById('GandiTerminal');
    return () => {
      dispose();
      setLogs([]);
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
            context={{
              ...context,
              Console: {
                console_maxLines: console_maxLines,
                console_disableOrigin: console_disableOrigin,
                logs,
                clean,
                transparentBg,
              },
              Stats: {
                stats_disableAnimation,
                transparentBg,
                statsData: statsDataRef.current,
              },
              Performance: {
                performance_maxTime,
                performance_startTime,
                setPerformance_startTime,
                performance_records,
                setPerformance_records,
              },
              terminalLoadMode,
            }}
            onClose={() => setVisible(false)}
          />,
          document.body,
        )}
    </section>,
    pluginsWrapper,
  );
};

DebuggerAddon.displayName = "DebuggerAddon";

export default DebuggerAddon;