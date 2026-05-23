import { Chart } from "chart.js";
import GaugeIcon from "assets/icon--gauge.svg";
import * as React from "react";
import { WindowContext } from ".";

export const PerformanceButton: React.FC<{ label: string }> = ({ label }) => {
  return (
    <>
      <GaugeIcon />
      {label}
    </>
  );
};

export const PerformanceWindow: React.FC<{ context: WindowContext }> = ({ context }) => {
  return <></>;
};
