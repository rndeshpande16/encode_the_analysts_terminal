import type { ReactNode } from "react";
import clsx from "clsx";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { useAnomalyPulse } from "../../hooks/use-anomaly-pulse.ts";
import { PulseIndicator } from "../shared/PulseIndicator.tsx";

interface PanelProps {
  title: string;
  panelId: string;
  isDraggable?: boolean;
  children: ReactNode;
}

export function Panel({ title, children, isDraggable = true }: PanelProps) {
  const activeInstrument = useSelectionStore((s) => s.activeInstrument);
  const { isActive, glowClass } = useAnomalyPulse(activeInstrument);

  return (
    <div
      className={clsx(
        "flex h-full flex-col overflow-hidden rounded-lg border bg-[var(--color-terminal-panel)]",
        isActive ? glowClass : "border-[var(--color-terminal-border)]",
      )}
      style={isActive ? { borderColor: "rgba(245, 158, 11, 0.3)" } : undefined}
    >
      {/* Title bar (drag handle) */}
      <div
        className={clsx(
          "panel-drag-handle flex items-center justify-between border-b border-[var(--color-terminal-border)] px-3 py-1.5",
          isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        )}
      >
        <div className="flex items-center gap-2">
          <PulseIndicator active={isActive} />
          <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            {title}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
