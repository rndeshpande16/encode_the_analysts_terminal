import clsx from "clsx";
import { useAnomalyStore } from "../../stores/anomaly-store.ts";
import type { AnomalyType } from "../../engine/types.ts";
import { formatTime } from "../../lib/format.ts";

const TYPE_ICONS: Record<AnomalyType, string> = {
  price_spike: "\u26A1",
  volume_burst: "\u{1F4CA}",
  correlation_break: "\u{1F500}",
  momentum_shift: "\u{1F300}",
};

const TYPE_COLORS: Record<AnomalyType, string> = {
  price_spike: "bg-amber-500/20 border-amber-500/30",
  volume_burst: "bg-blue-500/20 border-blue-500/30",
  correlation_break: "bg-purple-500/20 border-purple-500/30",
  momentum_shift: "bg-amber-500/20 border-amber-500/30",
};

export function WhisperOverlay() {
  const activeWhispers = useAnomalyStore((s) => s.activeWhispers);
  const dismissWhisper = useAnomalyStore((s) => s.dismissWhisper);

  if (activeWhispers.length === 0) return null;

  return (
    <div className="absolute top-0 right-0 left-0 z-50 flex flex-col items-center gap-1 pt-1 pointer-events-none">
      {activeWhispers.map((anomaly) => (
        <div
          key={anomaly.id}
          className={clsx(
            "animate-whisper-in pointer-events-auto flex items-center gap-3 rounded-md border px-4 py-1.5 text-xs backdrop-blur-sm",
            TYPE_COLORS[anomaly.type],
          )}
          onClick={() => dismissWhisper(anomaly.id)}
        >
          <span>{TYPE_ICONS[anomaly.type]}</span>
          <span className="font-medium text-slate-200">{anomaly.symbol}</span>
          <span className="text-slate-400">{anomaly.message}</span>
          <div className="ml-2 h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-[var(--color-anomaly)]"
              style={{ width: `${anomaly.severity * 100}%` }}
            />
          </div>
          <span className="text-slate-500">
            {formatTime(anomaly.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
