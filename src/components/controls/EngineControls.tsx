import clsx from "clsx";

const SPEEDS = [0.5, 1, 2, 5];

interface EngineControlsProps {
  status: "running" | "paused" | "stopped";
  speed: number;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

export function EngineControls({
  status,
  speed,
  onToggle,
  onSpeedChange,
}: EngineControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        className="rounded border border-[var(--color-terminal-border)] bg-[var(--color-terminal-panel)] px-2 py-0.5 text-xs text-slate-300 transition-colors hover:bg-slate-700"
      >
        {status === "running" ? "\u23F8 Pause" : "\u25B6 Play"}
      </button>
      <div className="flex gap-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={clsx(
              "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              speed === s
                ? "bg-blue-500/20 text-blue-400"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
