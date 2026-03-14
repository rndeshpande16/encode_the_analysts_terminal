import { useSelectionStore } from "../../stores/selection-store.ts";
import { activeFundamentals } from "../../engine/constants.ts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function AnalystForecastPanel() {
  const symbol = useSelectionStore((s) => s.activeInstrument);
  const fund = activeFundamentals()[symbol];

  if (!fund || !fund.monthlyReturns || fund.monthlyReturns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-600">
        No forecast data available
      </div>
    );
  }

  const returns = fund.monthlyReturns;
  const maxAbs = Math.max(...returns.map(Math.abs), 1);

  // Simple prediction: weighted average of recent months (more weight on recent)
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < returns.length; i++) {
    const w = i + 1;
    weightedSum += returns[i] * w;
    weightTotal += w;
  }
  const predicted = weightedSum / weightTotal;

  // Average monthly return
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-[11px]">
      {/* Header */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[9px] font-semibold uppercase text-slate-500">
          Monthly Performance (Last 12M)
        </span>
        <span className="text-[9px] text-slate-500">
          Avg:{" "}
          <span
            className="font-medium"
            style={{ color: avgReturn >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {avgReturn >= 0 ? "+" : ""}
            {avgReturn.toFixed(2)}%
          </span>
        </span>
      </div>

      {/* Bar Chart */}
      <div className="mb-3 flex flex-1 items-end gap-1">
        {returns.map((ret, i) => {
          const isUp = ret >= 0;
          const barHeight = Math.max(4, (Math.abs(ret) / maxAbs) * 100);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
              <span
                className="text-[8px] tabular-nums font-medium"
                style={{ color: isUp ? "#22c55e" : "#ef4444" }}
              >
                {isUp ? "+" : ""}
                {ret.toFixed(1)}%
              </span>
              <div
                className="relative flex w-full justify-center"
                style={{ height: `${barHeight}%`, minHeight: 4 }}
              >
                <div
                  className="w-full max-w-[18px] rounded-t"
                  style={{
                    height: "100%",
                    backgroundColor: isUp
                      ? "rgba(34, 197, 94, 0.6)"
                      : "rgba(239, 68, 68, 0.6)",
                  }}
                />
              </div>
              <span className="text-[8px] text-slate-500">{MONTHS[i]}</span>
            </div>
          );
        })}
      </div>

      {/* Prediction Section */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-2">
        <div className="mb-1 text-[9px] font-semibold uppercase text-slate-500">
          Next Month Forecast
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400">
              Predicted Return:{" "}
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: predicted >= 0 ? "#22c55e" : "#ef4444" }}
            >
              {predicted >= 0 ? "+" : ""}
              {predicted.toFixed(2)}%
            </span>
          </div>
          {fund.targetPrice > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Target Price: </span>
              <span className="text-sm font-bold text-blue-400 tabular-nums">
                {fund.targetPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>
        {/* Sentiment indicator */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, 50 + predicted * 10))}%`,
                background:
                  predicted >= 0
                    ? "linear-gradient(90deg, #eab308, #22c55e)"
                    : "linear-gradient(90deg, #ef4444, #eab308)",
              }}
            />
          </div>
          <span
            className="text-[9px] font-medium"
            style={{
              color:
                predicted >= 1
                  ? "#22c55e"
                  : predicted <= -1
                    ? "#ef4444"
                    : "#eab308",
            }}
          >
            {predicted >= 1
              ? "Bullish"
              : predicted <= -1
                ? "Bearish"
                : "Neutral"}
          </span>
        </div>
      </div>
    </div>
  );
}
