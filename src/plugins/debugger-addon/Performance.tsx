import * as React from "react";
import GaugeIcon from "assets/icon--gauge.svg";
import { WindowContext } from ".";
import PerformanceStyle from "./style-performance.less";
import CirclePlay from "assets/icon--circle-play.svg";
import CircleStop from "assets/icon--circle-stop.svg";
import { useTable, useSortBy } from "react-table";
import { IBlockly, getBlockTextAndColor } from "./getCurrentBlocks";

export const PerformanceButton: React.FC<{ label: string }> = ({ label }) => {
  return (
    <>
      <GaugeIcon />
      {label}
    </>
  );
};

interface PerformanceRecord {
  count: number;
  selfTime: number;
  totalTime: number;
}

interface BlockFuncRecord extends PerformanceRecord {}

export interface Record {
  blockFunc: {
    [K: string]: BlockFuncRecord;
  };
  render: PerformanceRecord;
  execute: PerformanceRecord;
}

export const PerformanceWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const {
    vm,
    blockly,
    msg,
    Performance: {
      performance_maxTime,
      performance_startTime,
      setPerformance_startTime,
      performance_records,
      setPerformance_records,
    },
  } = context;
  console.log(vm);
  const [profilingStarted, setProfilingStarted] = React.useState(false);
  const profilerRef = React.useRef<Scratch.Profiler | null>(null);
  const onFrameRef = React.useRef((frame: Scratch.ProfilerFrame) => {
    const profiler = profilerRef.current;
    if (!profiler) return;
    switch (frame.id) {
      case profiler.idByName("blockFunction"):
        onBlockFrame(frame);
        break;
      case profiler.idByName("RenderWebGL.draw"):
        onRenderFrame(frame);
        break;
      case profiler.idByName("execute"):
        onExecuteFrame(frame);
        break;
    }
  });

  // 初始化 profiler
  React.useEffect(() => {
    vm.runtime.enableProfiling();
    const { profiler } = vm.runtime;
    if (!profiler) {
      console.warn("profiler not available");
      return;
    }
    profilerRef.current = profiler;
    profiler.onFrame = (frame) => onFrameRef.current(frame);
    vm.runtime.disableProfiling();
    return () => {
      vm.runtime.disableProfiling();
    };
  }, []);
  React.useEffect(() => {
    const { runtime } = vm;
    const { getOpcodeFunction } = runtime;
    runtime.getOpcodeFunction = function (this: Scratch.Runtime, opcode: string) {
      const func = getOpcodeFunction.call(this, opcode);
      if (func) {
        return function (...args) {
          if (runtime.profiler) {
            runtime.profiler.start(runtime.profiler.idByName("blockFunction"), `Performance-${opcode}`);
          }
          const ret = func(...args);
          if (runtime.profiler) {
            runtime.profiler.stop();
          }
          return ret;
        };
      }
    };
    return () => {
      runtime.getOpcodeFunction = getOpcodeFunction;
    };
  }, [profilingStarted]);
  const switchProfiling = () => {
    if (profilingStarted) {
      endProfiling();
      setProfilingStarted(false);
    } else {
      startProfiling();
      setProfilingStarted(true);
    }
  };

  const endProfiling = () => {
    const profiler = profilerRef.current;
    if (!profiler) return;
    // profiler.reportFrames(); // profiler will auto report when runtime._step
    vm.runtime.disableProfiling();
    console.log(performance_records);
  };

  const startProfiling = () => {
    const profiler = profilerRef.current;
    if (!profiler) return;
    setPerformance_startTime(window.performance.now());
    setPerformance_records({
      blockFunc: {},
      render: { count: 0, selfTime: 0, totalTime: 0 },
      execute: { count: 0, selfTime: 0, totalTime: 0 },
    });
    vm.runtime.profiler = profiler;
  };

  const onBlockFrame = (frame: Scratch.ProfilerFrame) => {
    frame = { ...frame };
    console.log(frame);
    const rawOpcode: string = frame.arg;
    const isPerformanceMark = rawOpcode.startsWith("Performance-");
    if (!isPerformanceMark) {
      return;
    }
    const opcode = isPerformanceMark ? rawOpcode.slice("Performance-".length) : rawOpcode;
    setPerformance_records((records) => {
      const { blockFunc } = records;
      const existing = blockFunc[opcode] || { count: 0, selfTime: 0, totalTime: 0 };
      return {
        ...records,
        blockFunc: {
          ...blockFunc,
          [opcode]: mergeFrameToRecord(existing, frame),
        },
      };
    });
  };

  const onRenderFrame = (frame: Scratch.ProfilerFrame) => {
    frame = { ...frame };
    setPerformance_records((records) => {
      const render = records.render || { count: 0, selfTime: 0, totalTime: 0 };
      return { ...records, render: mergeFrameToRecord(render, frame) };
    });
  };

  const onExecuteFrame = (frame: Scratch.ProfilerFrame) => {
    frame = { ...frame };
    setPerformance_records((records) => {
      const execute = records.execute || { count: 0, selfTime: 0, totalTime: 0 };
      return { ...records, execute: mergeFrameToRecord(execute, frame) };
    });
  };

  function mergeFrameToRecord(record: PerformanceRecord, frame: Scratch.ProfilerFrame): PerformanceRecord {
    return {
      count: record.count + (frame.count || 0),
      selfTime: record.selfTime + (frame.selfTime || 0),
      totalTime: record.totalTime + (frame.totalTime || 0),
    };
  }

  return (
    <div className={PerformanceStyle.container}>
      <button className={PerformanceStyle.topButton} onClick={switchProfiling}>
        {profilingStarted ? <CircleStop /> : <CirclePlay />}
      </button>
      <ProfileDisplay
        profilingStarted={profilingStarted}
        performance_maxTime={performance_maxTime}
        startTime={performance_startTime}
        records={performance_records}
        blockly={blockly}
        msg={msg}
        onStop={switchProfiling}
      />
    </div>
  );
};

interface TableRow {
  name: string;
  count: number;
  selfTime: number;
  totalTime: number;
  pct: number;
}

const PerfTableSection: React.FC<{
  title: string;
  data: TableRow[];
  countHeader: string;
  selfHeader: string;
  totalHeader: string;
  pctHeader: string;
}> = ({ title, data, countHeader, selfHeader, totalHeader, pctHeader }) => {
  const sortNumberAsc = React.useCallback((a: number, b: number) => (a || 0) - (b || 0), []);
  const columns = React.useMemo(
    () => [
      {
        Header: title,
        accessor: "name",
        className: PerformanceStyle.colBlock,
        headerClassName: PerformanceStyle.headerTitle,
        Cell: ({ value, row }: any) => (
          <td className={`${PerformanceStyle.blockName} ${PerformanceStyle.colBlock}`} title={row.original.name}>
            {value}
          </td>
        ),
        disableSortBy: true,
      },
      {
        Header: countHeader,
        accessor: "count",
        className: PerformanceStyle.colNum,
        sortType: (rowA: any, rowB: any, columnId: string) =>
          sortNumberAsc(rowA.values[columnId], rowB.values[columnId]),
        Cell: ({ value }: any) => <td className={PerformanceStyle.colNum}>{value}</td>,
      },
      {
        Header: selfHeader,
        accessor: "selfTime",
        className: PerformanceStyle.colNum,
        sortType: (rowA: any, rowB: any, columnId: string) =>
          sortNumberAsc(rowA.values[columnId], rowB.values[columnId]),
        Cell: ({ value }: any) => <td className={PerformanceStyle.colNum}>{value.toFixed(2)}</td>,
      },
      {
        Header: totalHeader,
        accessor: "totalTime",
        className: PerformanceStyle.colNum,
        sortType: (rowA: any, rowB: any, columnId: string) =>
          sortNumberAsc(rowA.values[columnId], rowB.values[columnId]),
        Cell: ({ value }: any) => <td className={PerformanceStyle.colNum}>{value.toFixed(2)}</td>,
      },
      {
        Header: pctHeader,
        accessor: "pct",
        className: PerformanceStyle.colPct,
        sortType: (rowA: any, rowB: any, columnId: string) =>
          sortNumberAsc(rowA.values[columnId], rowB.values[columnId]),
        Cell: ({ value }: any) => (
          <td className={PerformanceStyle.colPct}>
            <div className={PerformanceStyle.barCell}>
              <div className={PerformanceStyle.barWrapper}>
                <div className={PerformanceStyle.bar} style={{ width: `${Math.max(value, 0.5)}%` }} />
              </div>
              <span>{value.toFixed(1)}%</span>
            </div>
          </td>
        ),
      },
    ],
    [title, sortNumberAsc, countHeader, selfHeader, totalHeader, pctHeader],
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: [{ id: "selfTime", desc: true }],
      },
      disableSortRemove: true,
      autoResetSortBy: false,
    } as any,
    useSortBy,
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance as any;

  return (
    <table {...getTableProps()} className={PerformanceStyle.perfTable}>
      <thead>
        {headerGroups.map((headerGroup: any) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column: any) => {
              const canSort = !column.disableSortBy;
              const headerProps = column.getHeaderProps(canSort ? column.getSortByToggleProps() : undefined);
              return (
                <th
                  {...headerProps}
                  className={`${column.headerClassName || column.className || ""} ${
                    canSort ? PerformanceStyle.sortable : ""
                  }`}
                >
                  {column.render("Header")}
                  {canSort ? <span> {column.isSorted ? (column.isSortedDesc ? "↓" : "↑") : ""}</span> : null}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: any) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()} key={row.original.name}>
              {row.cells.map((cell: any) => cell.render("Cell"))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const ProfileDisplay: React.FC<{
  profilingStarted: boolean;
  records: Record;
  performance_maxTime: number;
  startTime: number;
  blockly: IBlockly;
  msg: (key: string) => string;
  onStop?: () => void;
}> = ({ records, profilingStarted, performance_maxTime, startTime, blockly, msg, onStop }) => {
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(window.performance.now()), 20);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!profilingStarted) return;
    const elapsed = (now - startTime) / 1000;
    if (elapsed >= performance_maxTime) onStop?.();
  }, [now, profilingStarted, startTime, performance_maxTime, onStop]);

  const countHeader = msg("plugins.debuggerAddon.performance.header.count");
  const selfHeader = msg("plugins.debuggerAddon.performance.header.self");
  const totalHeader = msg("plugins.debuggerAddon.performance.header.total");
  const pctHeader = msg("plugins.debuggerAddon.performance.header.pct");
  const executeTitle = msg("plugins.debuggerAddon.performance.section.execute");
  const blockTitle = msg("plugins.debuggerAddon.performance.section.block");

  if (profilingStarted) {
    const elapsed = (now - startTime) / 1000;
    const maxTime = performance_maxTime;
    const progress = Math.min((elapsed / maxTime) * 100, 100);
    
    return (
      <div className={PerformanceStyle.profiling}>
        <span>{msg("plugins.debuggerAddon.performance.status.profiling")}</span>
        <div className={PerformanceStyle.progressWrapper}>
          <div className={PerformanceStyle.progressTrack}>
            <div 
              className={PerformanceStyle.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={PerformanceStyle.progressText}>
            {elapsed.toFixed(1)}s / {maxTime}s
          </span>
        </div>
      </div>
    );
  }

  const blockEntries = Object.entries(records.blockFunc || {});
  if (!blockEntries.length && !records.render?.count && !records.execute?.count) {
    return (
      <div className={PerformanceStyle.profiling}>
        <span>{msg("plugins.debuggerAddon.performance.status.empty")}</span>
      </div>
    );
  }

  const totalBlockSelfTime = blockEntries.reduce((sum, [, r]) => sum + (r.selfTime || 0), 0);
  const renderSelfTime = records.render?.selfTime || 0;
  const executeSelfTime = records.execute?.selfTime || 0;
  const totalSelfTime = totalBlockSelfTime + renderSelfTime + executeSelfTime;

  const blockRows: TableRow[] = blockEntries.map(([opcode, r]) => {
    let displayName = opcode;
    try {
      const result = getBlockTextAndColor({ opcode }, blockly);
      if (result && result.text) {
        displayName = result.text;
      }
    } catch (e) {
      // 翻译失败时保留原 opcode
    }
    return {
      name: displayName,
      count: r.count || 0,
      selfTime: r.selfTime || 0,
      totalTime: r.totalTime || 0,
      pct: totalSelfTime > 0 ? ((r.selfTime || 0) / totalSelfTime) * 100 : 0,
    };
  });

  const renderRow: TableRow | null = records.render?.count
    ? {
        name: "RenderWebGL.draw",
        count: records.render.count,
        selfTime: renderSelfTime,
        totalTime: records.render.totalTime || 0,
        pct: totalSelfTime > 0 ? (renderSelfTime / totalSelfTime) * 100 : 0,
      }
    : null;

  const executeRow: TableRow | null = records.execute?.count
    ? {
        name: "execute",
        count: records.execute.count,
        selfTime: executeSelfTime,
        totalTime: records.execute.totalTime || 0,
        pct: totalSelfTime > 0 ? (executeSelfTime / totalSelfTime) * 100 : 0,
      }
    : null;

  const executeRows: TableRow[] = [executeRow, renderRow].filter((r): r is TableRow => r !== null);

  return (
    <div className={PerformanceStyle.tableWrapper}>
      {executeRows.length > 0 && (
        <PerfTableSection
          title={executeTitle}
          data={executeRows}
          countHeader={countHeader}
          selfHeader={selfHeader}
          totalHeader={totalHeader}
          pctHeader={pctHeader}
        />
      )}
      {blockRows.length > 0 && (
        <PerfTableSection
          title={blockTitle}
          data={blockRows}
          countHeader={countHeader}
          selfHeader={selfHeader}
          totalHeader={totalHeader}
          pctHeader={pctHeader}
        />
      )}
    </div>
  );
};
