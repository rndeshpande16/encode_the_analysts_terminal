import { memo } from "react";
import clsx from "clsx";
import { AnimatedNumber } from "./AnimatedNumber.tsx";

interface TickerProps {
  price: number;
  change: number;
  changePercent: number;
  decimals?: number;
  className?: string;
}

export const Ticker = memo(function Ticker({
  price,
  change,
  changePercent,
  decimals = 2,
  className,
}: TickerProps) {
  const isUp = change >= 0;

  return (
    <div className={clsx("flex items-baseline gap-2", className)}>
      <AnimatedNumber
        value={price}
        decimals={decimals}
        className="text-sm font-medium text-slate-200"
      />
      <span
        className={clsx(
          "text-xs tabular-nums",
          isUp
            ? "text-[var(--color-positive)]"
            : "text-[var(--color-negative)]",
        )}
      >
        {isUp ? "+" : ""}
        {change.toFixed(decimals)} ({isUp ? "+" : ""}
        {changePercent.toFixed(2)}%)
      </span>
    </div>
  );
});
