import { memo } from "react";

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const SparkLine = memo(function SparkLine({
  data,
  width = 60,
  height = 20,
  color,
}: SparkLineProps) {
  if (data.length < 2) return <svg width={width} height={height} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];
  const strokeColor =
    color ?? (isUp ? "var(--color-positive)" : "var(--color-negative)");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
