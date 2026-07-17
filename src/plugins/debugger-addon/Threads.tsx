import * as React from "react";
import ThreadIcon from "assets/icon--threads.svg";
import styleThreads from "./style-threads.less";
import { WindowContext } from ".";
import { getBlockTextAndColor } from "./getCurrentBlocks";

export const ThreadsButton: React.FC<{ label: string }> = ({ label }) => {
  return (
    <>
      <ThreadIcon />
      {label}
    </>
  );
};

interface ThreadInfo {
  id: number;
  targetName: string;
  targetId: string;
  topBlockId: string;
  stack: string[];
  isRunning: boolean;
  isCompiled: boolean;
  depth: number;
  children?: ThreadInfo[];
}

export const ThreadsWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const { vm, blockly, msg } = context;
  const [threads, setThreads] = React.useState<ThreadInfo[]>([]);
  const [runningThreadId, setRunningThreadId] = React.useState<number | null>(null);
  const threadIdMap = React.useRef<WeakMap<any, number>>(new WeakMap());
  let nextThreadId = React.useRef(1);

  const [isCompilerEnabled, setCompilerEnabled] = React.useState(vm.runtime.compilerOptions.enabled);

  React.useEffect(() => {
    // @ts-ignore
    const originalSetCompilerOptions = vm.setCompilerOptions;
    // @ts-ignore
    vm.setCompilerOptions = function(options: any) {
      const result = originalSetCompilerOptions.call(this, options);
      setCompilerEnabled(options?.enabled === true);
      updateThreads();
      return result;
    };
    // @ts-ignore
    return () => vm.setCompilerOptions = originalSetCompilerOptions;
  }, [vm]);

  const getThreadId = React.useCallback((thread: any): number => {
    if (!threadIdMap.current.has(thread)) {
      threadIdMap.current.set(thread, nextThreadId.current++);
    }
    return threadIdMap.current.get(thread)!;
  }, []);

  const getBlockDisplayInfo = React.useCallback((opcode: string) => {
    try {
      const result = getBlockTextAndColor({ opcode }, blockly);
      if (result?.text) {
        return { text: result.text, color: result.color || '#666' };
      }
      return { text: opcode, color: '#666' };
    } catch {
      return { text: opcode, color: '#666' };
    }
  }, [blockly]);

  const collectThreadInfo = React.useCallback((thread: any, depth: number, visited: Set<any>): ThreadInfo | null => {
    if (visited.has(thread)) return null;
    visited.add(thread);

    const target = thread.target;
    if (!target) return null;
    if (thread.updateMonitor) return null;

    const id = getThreadId(thread);
    const runningThread = vm.runtime.sequencer?.activeThread;
    const isRunning = thread === runningThread;

    const stackOpcode: string[] = [];
    if (thread.stackFrames) {
      for (const frame of thread.stackFrames) {
        if (frame.op?.opcode) {
          stackOpcode.push(frame.op.opcode);
        }
      }
    }

    const info: ThreadInfo = {
      id,
      targetName: target.getName?.() || "Unknown",
      targetId: target.id,
      topBlockId: thread.topBlock || null,
      stack: stackOpcode,
      isRunning,
      isCompiled: thread.isCompiled || false,
      depth,
      children: [],
    };

    // 处理子线程
    if (thread.stackFrames) {
      for (const frame of thread.stackFrames) {
        if (frame.executionContext?.startedThreads) {
          for (const childThread of frame.executionContext.startedThreads) {
            const childInfo = collectThreadInfo(childThread, depth + 1, visited);
            if (childInfo) {
              info.children!.push(childInfo);
            }
          }
        }
      }
    }

    return info;
  }, [getThreadId, vm]);

  const updateThreads = React.useCallback(() => {
    const allThreads = vm.runtime.threads || [];
    const visited = new Set<any>();
    const result: ThreadInfo[] = [];

    for (const thread of allThreads) {
      const info = collectThreadInfo(thread, 0, visited);
      if (info) {
        result.push(info);
      }
    }

    const running = vm.runtime.sequencer?.activeThread;
    if (running) {
      setRunningThreadId(getThreadId(running));
    } else {
      setRunningThreadId(null);
    }

    setThreads(result);
  }, [vm, collectThreadInfo, getThreadId]);

  React.useEffect(() => {
    updateThreads();

    const { runtime } = vm;
    const originalStep = runtime._step;
    runtime._step = function(this: any) {
      const result = originalStep.call(this);
      requestAnimationFrame(() => {
        updateThreads();
      });
      return result;
    };

    return () => {
      runtime._step = originalStep;
    };
  }, [vm, updateThreads]);

  const jumpToBlock = React.useCallback((targetId: string, blockId: string) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target) return;

    vm.setEditingTarget(targetId);
    const workspace = blockly.getMainWorkspace();
    const blocklyBlock = workspace?.getBlockById(blockId);
    if (blocklyBlock) {
      blocklyBlock.select();
    }
  }, [vm, blockly]);

  const renderThread = (thread: ThreadInfo, isChild = false) => {
    console.log(thread);
    const isRunning = thread.isRunning || thread.id === runningThreadId;

    return (
      <div key={thread.id} className={styleThreads.threadItem}>
        <div className={`${styleThreads.threadHeader} ${isRunning ? styleThreads.running : ''}`}>
          <div className={styleThreads.threadIndent} style={{ paddingLeft: `${thread.depth * 20}px` }}>
            {isChild && <span className={styleThreads.threadChildIcon}>└─</span>}
            <span className={styleThreads.threadTargetName}>{thread.targetName}</span>
            <span className={styleThreads.threadId}>#{thread.id}</span>
            {isRunning && <span className={styleThreads.threadRunningBadge}>{msg("plugins.debuggerAddon.threads.running")}</span>}
            {thread.isCompiled && <span className={styleThreads.threadCompiledBadge}>{msg("plugins.debuggerAddon.threads.compiled")}</span>}
          </div>
        </div>
        {(thread.stack.length > 0 || thread.topBlockId) && (
          <div className={styleThreads.threadStack}>
            {(thread.stack.length ? thread.stack : [thread.topBlockId]).map((opcode, idx) => {
              const blockInfo = getBlockDisplayInfo(opcode);
              return (
                <div key={idx} className={styleThreads.threadStackItem}>
                  <span className={styleThreads.threadStackIndex}>{idx + 1}.</span>
                  <span 
                    className={styleThreads.threadStackBlock}
                    style={{ 
                      backgroundColor: blockInfo.color + '33',
                      color: blockInfo.color,
                    }}
                  >
                    {blockInfo.text}
                  </span>
                  <a
                    className={styleThreads.targetLink}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpToBlock(thread.targetId, thread.stack[idx]);
                    }}
                  >
                    {thread.targetName}
                    {!vm.runtime.getTargetById(thread.targetId)?.isOriginal && msg("plugins.debuggerAddon.console.isClone")}
                  </a>
                </div>
              );
            })}
          </div>
        )}
        
        {thread.children && thread.children.length > 0 && (
          <div className={styleThreads.threadChildren}>
            {thread.children.map(child => renderThread(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styleThreads.threadsWindow}>
      {isCompilerEnabled && (
        <div className={styleThreads.threadsWarning}>
          {msg("plugins.debuggerAddon.threads.compilerWarning")}
        </div>
      )}
      {
        threads.length
          ? <div className={styleThreads.threadsList}>
              {threads.map(thread => renderThread(thread))}
            </div>
          : <div className={styleThreads.threadsEmpty}>
              {msg("plugins.debuggerAddon.threads.empty")}
            </div>
      }
    </div>
  );
};