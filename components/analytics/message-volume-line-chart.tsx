"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MessageVolumePoint = {
  key: string;
  count: number;
  label: string;
  shortLabel: string;
};

type MessageVolumeLineChartProps = {
  data: MessageVolumePoint[];
  className?: string;
};

export function MessageVolumeLineChart({ data, className = "h-80" }: MessageVolumeLineChartProps) {
  const chartShellRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(640);
  const activePoint = activeIndex === null ? null : data[activeIndex];
  const chart = useMemo(() => buildChart(data, chartWidth), [data, chartWidth]);
  const labelStep = data.length > 20 ? 3 : data.length > 14 ? 2 : 1;

  useEffect(() => {
    const chartShell = chartShellRef.current;

    if (!chartShell) {
      return;
    }

    const updateWidth = () => {
      setChartWidth(Math.max(640, Math.round(chartShell.clientWidth)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(chartShell);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <div className={`${className} w-full rounded-lg border border-harlo-line bg-harlo-canvas/40 p-4`}>
        <div ref={chartShellRef} className="h-full w-full">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-full w-full overflow-visible" role="img" aria-label="Message volume line chart">
            {[0, 1, 2, 3].map((line) => {
              const y = chart.top + ((chart.bottom - chart.top) / 3) * line;
              return (
                <line
                  key={line}
                  x1={chart.left}
                  x2={chart.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8ee"
                  strokeDasharray={line === 3 ? "0" : "4 6"}
                />
              );
            })}

            <polyline
              points={chart.points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke="#087f95"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={`${chart.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} L ${chart.right} ${chart.bottom} L ${chart.left} ${chart.bottom} Z`}
              fill="url(#messageVolumeFill)"
              opacity="0.42"
            />

            <defs>
              <linearGradient id="messageVolumeFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#087f95" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#087f95" stopOpacity="0" />
              </linearGradient>
            </defs>

            {chart.points.map((point, index) => {
              const isActive = activeIndex === index;

              return (
                <g key={data[index].key}>
                  <rect
                    x={point.x - chart.step / 2}
                    y={0}
                    width={chart.step}
                    height={chart.height}
                    fill="transparent"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    tabIndex={0}
                    aria-label={`${data[index].label}: ${data[index].count} messages`}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 7 : 4}
                    fill={isActive ? "#066375" : "#087f95"}
                    stroke="white"
                    strokeWidth="3"
                    className="transition"
                  />
                </g>
              );
            })}

            {data.map((day, index) => {
              const shouldShowLabel = index === 0 || index === data.length - 1 || index % labelStep === 0;

              return shouldShowLabel ? (
                <text key={day.key} x={chart.points[index].x} y={chart.height - 12} textAnchor="middle" className="fill-harlo-muted text-[11px]">
                  {day.shortLabel}
                </text>
              ) : null;
            })}
          </svg>
        </div>
      </div>

      {activePoint ? (
        <div
          className="pointer-events-none absolute top-5 z-10 min-w-36 rounded-lg border border-harlo-line bg-white px-3 py-2 text-sm text-harlo-ink shadow-soft"
          style={{
            left: `${chart.points[activeIndex ?? 0].x / chart.width * 100}%`,
            transform: activeIndex !== null && activeIndex > data.length - 4 ? "translateX(-100%)" : "translateX(-10%)"
          }}
        >
          <p className="font-semibold">{activePoint.label}</p>
          <p className="mt-1 text-harlo-muted">{activePoint.count} messages</p>
        </div>
      ) : null}
    </div>
  );
}

function buildChart(data: MessageVolumePoint[], width: number) {
  const left = 22;
  const right = width - 22;
  const top = 18;
  const bottom = 220;
  const height = 260;
  const max = Math.max(1, ...data.map((point) => point.count));
  const step = data.length > 1 ? (right - left) / (data.length - 1) : right - left;
  const points = data.map((point, index) => ({
    x: left + step * index,
    y: bottom - (point.count / max) * (bottom - top)
  }));

  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    step,
    points
  };
}
