import { useState, useEffect } from "react";
import { useMarketStore } from "../../stores/market-store.ts";

interface StatusBarProps {
  engineStatus: "running" | "paused" | "stopped";
  speed: number;
}

export function StatusBar({ engineStatus, speed }: StatusBarProps) {
  const tickCount = useMarketStore((s) => s.tickCount);
  const [clock, setClock] = useState(
    new Date().toLocaleTimeString("en-US", { hour12: false }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="flex items-center justify-between border-t border-[var(--color-terminal-border)] bg-[var(--color-terminal-surface)] px-4 py-1 text-[10px] text-slate-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              engineStatus === "running"
                ? "bg-[var(--color-positive)] animate-heartbeat"
                : engineStatus === "paused"
                  ? "bg-[var(--color-anomaly)]"
                  : "bg-slate-600"
            }`}
          />
          {engineStatus.toUpperCase()}
        </span>
        <span>SPEED: {speed}x</span>
        <span>TICKS: {tickCount.toLocaleString()}</span>
      </div>
      <span>{clock}</span>
    </footer>
  );
}
