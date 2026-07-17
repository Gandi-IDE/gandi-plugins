import * as React from "react";
import TerminalIcon from "assets/icon--terminal-1.svg";
import TrashIcon from "assets/icon--trashcan.svg";
import styleConsole from "./style-console.less";
import { WindowContext } from ".";
import { scrollBlockIntoView } from "utils/block-helper";
import Tooltip from "components/Tooltip";

type ConsoleLine = { msg: string; count: number; target: Scratch.RenderTarget; block: string };
interface Blockly {
  getMainWorkspace(): Blockly.WorkspaceSvg;
  Events: {
    Abstract: any;
  };
}

export const ConsoleButton: React.FC<{ label: string }> = ({ label }) => {
  return (
    <>
      <TerminalIcon />
      {label}
    </>
  );
};

export const ConsoleWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const { Console, msg } = context;
  const { logs, clean, console_transparent } = Console;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 有新日志时自动滚动到底部
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [logs]);

  const jumpToBlock = React.useCallback(
    (line: ConsoleLine) => {
      const { vm, blockly: _blockly } = context;
      const blockly = _blockly as Blockly;
      vm.setEditingTarget(line.target.id);
      const workspace = blockly.getMainWorkspace();
      const blocklyBlock = workspace.blockDB_[line.block];
      if (blocklyBlock) {
        scrollBlockIntoView(blocklyBlock, workspace);
      }
    },
    [logs],
  );

  return (
    <div className={styleConsole.w100H100}>
      <button className={styleConsole.trash} onClick={() => clean()}>
        <TrashIcon />
      </button>
      <div className={`${styleConsole.consoleWindow} ${console_transparent ? styleConsole.transparent : ''}`} ref={scrollRef}>
        {logs.length ?
          (() => {
            let renderLogs = logs;
            let startKey = 0;
            const { console_maxLines: maxLines } = context.Console;
            if (logs.length > maxLines) {
              renderLogs = logs.slice(-maxLines);
              startKey = logs.length - maxLines;
            }
            return renderLogs.map((log, i) => (
              <div className={styleConsole.logLine} key={i + startKey}>
                {log.count > 1 && <div className={styleConsole.logCount}>{log.count}</div>}
                <span dangerouslySetInnerHTML={{ __html: log.msg }} className={styleConsole.logContent} />
                {log.innerBlockText && (
                  <span className={styleConsole.logInnerBlockTip}>
                    <span style={{ backgroundColor: log.innerBlockColor }}>{log.innerBlockText ?? ''}</span>
                  </span>
                )}
                <TargetLink target={log.target} onClick={() => jumpToBlock(log)} msg={msg}></TargetLink>
              </div>
            ));
          })()
        : <div className={styleConsole.emptyState}>
            {msg("plugins.debuggerAddon.console.empty")}
          </div>}
      </div>
    </div>
  );
};

interface TargetContext {
  onClick(): any;
  target: Scratch.RenderTarget;
  msg: (key: string) => string;
}

export interface DollyProTarget extends Scratch.RenderTarget {
  DollyPro: {
    ID: string;
    extraData: {};
    isInGroup: {};
  };
}

const TargetLink: React.FC<TargetContext> = (context) => {
  const { onClick, target, msg } = context;
  const { sprite, isOriginal, id } = target;
  const { name } = sprite;
  let tipId = id;
  if ("DollyPro" in target) {
    const dollyTarget = target as DollyProTarget;
    const { DollyPro } = dollyTarget;
    const { ID } = DollyPro;
    if (ID) {
      tipId = `${ID}(${id})`;
    }
  }
  return (
    <a
      className={styleConsole.targetLink}
      onClick={(e) => {
        e.preventDefault();

        onClick();
      }}
    >
      {name}

      {!isOriginal && (
        <Tooltip
          tipText={tipId}
          icon={msg("plugins.debuggerAddon.console.isClone")}
          className={styleConsole.targetTooltip}
        />
      )}
    </a>
  );
};