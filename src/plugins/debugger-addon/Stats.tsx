import { Chart } from "chart.js/auto";
import ChartIcon from "assets/icon--chart.svg";
import * as React from "react";
import { WindowContext } from ".";
import stylePerformance from "./style-stats.less";

export const StatsButton: React.FC<{ label: string }> = ({ label }) => {
  return (
    <>
      <ChartIcon />
      {label}
    </>
  );
};

const labels = Array.from({ length: 20 }, (_, i) => 19 - i);

interface YAxis {
  min: 0;
  suggestedMax: number;
  display: boolean | "auto";
  ticks: {
    color: string;
  };
}
type ScalesOptions = {
  fpsY: YAxis;
  clonesY: YAxis;
  x: {
    ticks: {
      stepSize: 1;
      color: string;
    };
  };
};

const FPS_COLOR = "#09F7F7";
const CLONES_COLOR = "#F4B960";
const WHITE = "#FFFFFF";

export const StatsWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const framesInSecRef = React.useRef(0);
  const {
    vm,
    msg,
    Stats: { stats_disableAnimation },
  } = context;

  const scaleOptions: ScalesOptions = {
    fpsY: {
      min: 0,
      suggestedMax: 50,
      display: "auto",
      ticks: {
        color: FPS_COLOR,
      },
    },
    clonesY: {
      min: 0,
      suggestedMax: 300,
      display: "auto",
      ticks: {
        color: CLONES_COLOR,
      },
    },
    x: {
      ticks: {
        stepSize: 1,
        color: WHITE,
      },
    },
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "fps", data: new Array(20), yAxisID: "fpsY", borderColor: FPS_COLOR },
          {
            label: msg("plugins.debuggerAddon.stats.clones"),
            data: new Array(20),
            yAxisID: "clonesY",
            borderColor: CLONES_COLOR,
          },
        ],
      },
      options: {
        animation: stats_disableAnimation ? false : undefined,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: WHITE,
              font: {
                size: 16,
              },
            },
          },
        },
        // @ts-ignore
        scales: scaleOptions,
      },
    });
    chartRef.current = chartInstance;
    return () => {
      chartInstance.destroy();
      chartRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    const { runtime } = vm;
    const { _step } = runtime;
    runtime._step = function () {
      _step.call(this);
      framesInSecRef.current++;
    };
    const interval = setInterval(() => {
      const framesInSec = framesInSecRef.current;
      const {
        options: { scales: scales_ },
      } = chart;
      const scales = scales_ as unknown as ScalesOptions;
      const { datasets } = chart.data;

      const fpsData = datasets[0].data;
      scales.fpsY.suggestedMax = runtime.framerate;
      fpsData.shift();
      fpsData.push(framesInSec);

      const clonesData = datasets[1].data;
      scales.clonesY.suggestedMax = runtime.runtimeOptions.maxClones;
      clonesData.shift();
      clonesData.push(runtime._cloneCounter);

      chart.update();
      framesInSecRef.current = 0;
    }, 1000);
    return () => {
      clearInterval(interval);
      runtime._step = _step;
    };
  }, [vm]);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    chart.options.animation = stats_disableAnimation ? false : undefined;
  }, [stats_disableAnimation]);

  return (
    <>
      <div className={stylePerformance.chart}>
        <canvas ref={canvasRef} />
      </div>
    </>
  );
};
