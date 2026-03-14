import { useAnomalyStore } from "../../stores/anomaly-store.ts";
import { formatTime } from "../../lib/format.ts";
import type { AnomalyType } from "../../engine/types.ts";
import clsx from "clsx";

const TYPE_LABELS: Record<AnomalyType, string> = {
  price_spike: "PRICE",
  volume_burst: "VOLUME",
  correlation_break: "CORREL",
  momentum_shift: "MOMT",
};

const TYPE_COLORS: Record<AnomalyType, string> = {
  price_spike: "text-amber-400",
  volume_burst: "text-blue-400",
  correlation_break: "text-purple-400",
  momentum_shift: "text-amber-400",
};

export function SignalFeedPanel() {
  const anomalies = useAnomalyStore((s) => s.anomalies);

  if (anomalies.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-600">
        Listening for signals...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="flex flex-col gap-1">
        {anomalies.map((anomaly, i) => (
          <div
            key={anomaly.id}
            className={clsx(
              "flex items-start gap-2 rounded border border-[var(--color-terminal-border)] bg-[var(--color-terminal-surface)] px-2 py-1.5 text-[11px]",
              i === 0 && "animate-slide-down",
            )}
          >
            <span className="text-slate-600 tabular-nums shrink-0">
              {formatTime(anomaly.timestamp)}
            </span>
            <span className="font-medium text-slate-300 shrink-0">
              {anomaly.symbol}
            </span>
            <span
              className={clsx(
                "rounded px-1 py-0.5 text-[9px] font-semibold uppercase shrink-0",
                TYPE_COLORS[anomaly.type],
              )}
            >
              {TYPE_LABELS[anomaly.type]}
            </span>
            <span className="text-slate-400 truncate">{anomaly.message}</span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <div className="h-1 w-10 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-[var(--color-anomaly)]"
                  style={{ width: `${anomaly.severity * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
