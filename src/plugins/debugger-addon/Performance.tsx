import { Chart } from "chart.js/auto";
import GaugeIcon from "assets/icon--gauge.svg";
import * as React from "react";
import { WindowContext } from ".";
import stylePerformance from "./style-performance.less";

export const PerformanceButton: React.FC<{ label: string }> = ({ label }) => {
  return (
    <>
      <GaugeIcon />
      {label}
    </>
  );
};

const labels = Array.from({ length: 20 }, (_, i) => 19 - i);

export const PerformanceWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  const fpsRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const framesRef = React.useRef(0);
  const { vm } = context;
  React.useEffect(() => {
    if (!fpsRef.current) {
      return;
    }
    chartRef.current = new Chart(fpsRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "fps", data: new Array(20) }],
      },
      options: {
        animation: undefined,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            min: 0,
            suggestedMax: 300,
          },
          x: {
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }, [fpsRef]);

  React.useEffect(() => {
    const { runtime } = vm;
    const { _step } = runtime;
    runtime._step = function () {
      _step.call(this);
      framesRef.current++;
    };
    const interval = setInterval(() => {
      const frames = framesRef.current;
      const chart = chartRef.current!;

      const fpsData = chart.data.datasets[0].data;
      chart.options.scales!.y!.suggestedMax = runtime.framerate;
      fpsData.shift();
      fpsData.push(frames);

      chart.update();
      framesRef.current = 0;
    }, 1000);
    return () => {
      clearInterval(interval);
      runtime._step = _step;
    };
  }, [vm]);
  return (
    <>
      <div className={stylePerformance.chart}>
        <canvas ref={fpsRef} />
      </div>
    </>
  );
};
