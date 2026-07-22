import * as React from "react";
import ThreadIcon from "assets/icon--threads.svg";
import styleThreads from "./style-threads.less";
import { WindowContext } from ".";
import { getBlockTextAndColor } from "./getCurrentBlocks";
import { scrollBlockIntoView } from "utils/block-helper";

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
  status: number;
  isCompiled: boolean;
  depth: number;
  children?: ThreadInfo[];
  target: any;
  stopThisScript: () => void;
  threadTag?: any;
  _stack: any;
}

export const ThreadsWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const { vm, blockly, msg } = context;
  const [threads, setThreads] = React.useState<ThreadInfo[]>([]);
  const threadIdMap = React.useRef<WeakMap<any, number>>(new WeakMap());
  let nextThreadId = React.useRef(1);

  const [isCompilerEnabled, setCompilerEnabled] = React.useState(vm.runtime.compilerOptions.enabled);

  React.useEffect(() => {
    const originalSetCompilerOptions = vm.setCompilerOptions;
    vm.setCompilerOptions = function(options: any) {
      const result = originalSetCompilerOptions.call(this, options);
      setCompilerEnabled(options?.enabled === true);
      updateThreads();
      return result;
    };
    return () => { vm.setCompilerOptions = originalSetCompilerOptions };
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

  const blockToOpcode = (b: string, thread?: ThreadInfo) => 
    thread?.target?.blocks.getBlock(b)?.opcode
      ?? Object.keys(blockly.Blocks).find(x => x.endsWith("_" + b))
        ?? b;

  const collectThreadInfo = React.useCallback((thread: any, depth: number, visited: Set<any>): ThreadInfo | null => {
    if (visited.has(thread)) return null;
    visited.add(thread);

    const target = thread.target;
    if (!target) return null;
    if (thread.updateMonitor) return null;

    const id = getThreadId(thread);

    const stackOpcode: string[] = [];
    thread.stackFrames.forEach((frame: any, i: any) => stackOpcode.push(frame.op?.opcode ?? blockToOpcode(thread.stack[i], thread)));

    const info: ThreadInfo = {
      id,
      target,
      targetName: target.sprite.name,
      targetId: target.id,
      topBlockId: thread.topBlock,
      stack: stackOpcode,
      status: thread.status,
      isCompiled: thread.isCompiled,
      depth,
      children: [],
      stopThisScript: thread.stopThisScript.bind(thread),
      threadTag: thread.threadTag ?? {},
      _stack: thread.stack,
    };

    // 处理子线程
    for (const frame of thread.stackFrames) {
      if (frame.executionContext?.startedThreads) {
        for (const childThread of frame.executionContext.startedThreads) {
          const childInfo = collectThreadInfo(childThread, depth + 1, visited);
          if (childInfo) info.children!.push(childInfo);
        }
      }
    }

    return info;
  }, [getThreadId, vm]);

  const updateThreads = React.useCallback(() => {
    const visited = new Set<any>();
    const result: ThreadInfo[] = [];

    for (const thread of vm.runtime.threads) {
      const info = collectThreadInfo(thread, 0, visited);
      info && result.push(info);
    }

    setThreads(result);
  }, [vm, collectThreadInfo, getThreadId]);

  React.useEffect(() => {
    updateThreads();
    const { runtime } = vm;
    const originalStep = runtime._step;
    runtime._step = function(this: any) {
      const result = originalStep.call(this);
      requestAnimationFrame(() => updateThreads());
      return result;
    };

    return () => { runtime._step = originalStep };
  }, [vm, updateThreads]);

  const jumpToBlock = React.useCallback((target: any, blockId: string) => {
    if (!target) return;
    vm.setEditingTarget(target.id);
    const workspace = blockly.getMainWorkspace();
    const blocklyBlock = workspace.blockDB_[blockId];
    blocklyBlock && scrollBlockIntoView(blocklyBlock, workspace);
  }, [vm, blockly]);

  const renderThread = (thread: ThreadInfo, isChild = false) => {
    const stack = thread.stack, tags = Object.keys(thread.threadTag);
    return (
      <div key={thread.id} className={styleThreads.threadItem}>
        <div className={styleThreads.threadHeader}>
          <div className={styleThreads.threadIndent} style={{ paddingLeft: `${thread.depth * 20}px` }}>
            {isChild && <span className={styleThreads.threadChildIcon}>└─</span>}
            <span className={styleThreads.threadTargetName}>{thread.targetName}</span>
            <span className={styleThreads.threadId}>#{thread.id}</span>
            {thread.status === 1 && <span className={styleThreads.threadPausedBadge}>{msg("plugins.debuggerAddon.threads.paused")}</span>}
            {thread.isCompiled && <span className={styleThreads.threadCompiledBadge}>{msg("plugins.debuggerAddon.threads.compiled")}</span>}
            {tags.map(tag => <span key={tag} className={styleThreads.threadTag}>{tag}</span>)}
            <button
              className={styleThreads.threadStopButton}
              onClick={thread.stopThisScript}
              title={msg("plugins.debuggerAddon.threads.stop")}
            ><span className={styleThreads.stopIcon}></span></button>
          </div>
        </div>
        {
          stack.length 
            ? <div className={styleThreads.threadStack}>
                {stack.map((opcode, idx) => {
                  const blockInfo = getBlockDisplayInfo(opcode);
                  return (
                    <div key={idx} className={styleThreads.threadStackItem}>
                      <span className={styleThreads.threadStackIndex}>{idx + 1}.</span>
                      <span className={styleThreads.threadStackBlock}
                        style={{ 
                          backgroundColor: blockInfo.color + '33',
                          color: blockInfo.color,
                        }}
                      >{blockInfo.text}</span>
                      <a className={styleThreads.targetLink}
                        onClick={e => {
                          e.preventDefault();
                          jumpToBlock(thread.target, thread._stack[idx]);
                        }}
                      >
                        {thread.targetName}
                        {!vm.runtime.getTargetById(thread.targetId)?.isOriginal && msg("plugins.debuggerAddon.console.isClone")}
                      </a>
                    </div>
                  );
                })}
              </div>
            : <span style={{ color: 'var(--theme-color-g400)' }}>无线程</span>
        }
        
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
      {threads.length
        ? <div className={styleThreads.threadsList}>
            {threads.map(thread => renderThread(thread))}
          </div>
        : <div className={styleThreads.threadsEmpty}>
            {msg("plugins.debuggerAddon.threads.empty")}
          </div>}
    </div>
  );
};