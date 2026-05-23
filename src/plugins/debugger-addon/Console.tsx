import * as React from "react";
import TerminalIcon from "assets/icon--terminal.svg";
import TrashIcon from "assets/icon--trashcan.svg";
import styleConsole from "./style-console.less";
import { WindowContext } from ".";
import { scrollBlockIntoView } from "utils/block-helper";

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
  const { Console } = context;
  const { logs, clean } = Console;
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
      <div className={styleConsole.consoleWindow}>
        {(() => {
          let renderLogs = logs;
          let startKey = 0;
          const { maxLines } = context.Console;
          if (logs.length > maxLines) {
            renderLogs = logs.slice(-maxLines);
            startKey = logs.length - maxLines;
          }
          return renderLogs.map((log, i) => (
            <div className={styleConsole.logLine} key={i + startKey}>
              {log.count > 1 && <div className={styleConsole.logCount}>{log.count}</div>}
              <div dangerouslySetInnerHTML={{ __html: log.msg }} />
              <a
                className={styleConsole.targetLink}
                onClick={(e) => {
                  e.preventDefault();
                  jumpToBlock(log);
                }}
              >
                {log.target.sprite.name}
              </a>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};
