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

interface YAxis {
  min: 0;
  suggestedMax: number;
  display: boolean | "auto";
  ticks: {
    color: string;
  };
  position: string;
  grid: any;
}
type ScalesOptions = {
  fpsY: YAxis;
  clonesY: YAxis;
  x: {
    ticks: {
      stepSize: 1;
      color: string;
    };
    grid: any;
  };
};

const FPS_COLOR = "#09F7F7";
const CLONES_COLOR = "#F4B960";
const WHITE = "#999999"; // 实际上是 GRAY
const gridGray = '#99999966';

export const StatsWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const framesInSecRef = React.useRef(0);
  const {
    vm, msg,
    Stats: { stats_disableAnimation, transparentBg, statsData },
  } = context;

  const scaleOptions: ScalesOptions = {
    fpsY: {
      min: 0,
      suggestedMax: 50,
      display: "auto",
      position: 'left',
      ticks: { color: FPS_COLOR },
      grid: { color: gridGray }
    },
    clonesY: {
      min: 0,
      suggestedMax: 300,
      display: "auto",
      position: 'right',
      ticks: { color: CLONES_COLOR },
      grid: { color: gridGray }
    },
    x: {
      ticks: {
        stepSize: 1,
        color: WHITE,
      },
      grid: { color: gridGray },
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
        labels: statsData.labels,
        datasets: [
          {
            label: "FPS",
            data: new Array(20),
            yAxisID: "fpsY",
            borderColor: FPS_COLOR
          },
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
              font: { size: 16 },
              usePointStyle: true,
              pointStyle: 'line',
            },
          },
        },
        // @ts-ignore
        scales: scaleOptions,
      },
    });
    chartRef.current = chartInstance;
    const updateInterval = setInterval(() => {
      const chart = chartRef.current;
      if (!chart) return;
      
      // 直接从持久数据读取更新
      chart.data.datasets[0].data = statsData.fps;
      chart.data.datasets[1].data = statsData.clones;
      chart.update();
    }, 100);
    
    return () => {
      chartInstance.destroy();
      clearInterval(updateInterval);
    };
  }, []);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    chart.options.animation = stats_disableAnimation ? false : undefined;
  }, [stats_disableAnimation]);

  return (
    <div className={`${stylePerformance.chart} ${transparentBg ? stylePerformance.transparent : ''}`}>
      <canvas ref={canvasRef} />
    </div>
  );
};
