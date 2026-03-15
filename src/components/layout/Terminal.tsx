import { PanelGrid } from "./PanelGrid.tsx";
import { StatusBar } from "./StatusBar.tsx";
import { EngineControls } from "../controls/EngineControls.tsx";
import { InstrumentSelector } from "../controls/InstrumentSelector.tsx";
import { TimeframeSelector } from "../controls/TimeframeSelector.tsx";
import { ThemeSelector } from "../controls/ThemeSelector.tsx";
import type { MarketMode } from "../../engine/types.ts";

interface TerminalProps {
  engineStatus: "running" | "paused" | "stopped";
  speed: number;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
  marketMode: MarketMode;
  onMarketSwitch: (mode: MarketMode) => void;
}

export function Terminal({
  engineStatus,
  speed,
  onToggle,
  onSpeedChange,
  marketMode,
  onMarketSwitch,
}: TerminalProps) {
  return (
    <div className="flex h-full max-w-full flex-col overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-1 border-b border-[var(--color-terminal-border)] bg-[var(--color-terminal-surface)] px-2 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-3">
          <h1 className="text-xs font-semibold tracking-widest text-slate-300 uppercase sm:text-sm">
            Encode
          </h1>
          <div className="hidden h-4 w-px bg-slate-700 sm:block" />

          {/* Market Toggle */}
          <div className="flex overflow-hidden rounded border border-slate-700 text-[10px] font-medium">
            <button
              onClick={() => onMarketSwitch("US")}
              className={`px-2.5 py-1 transition-colors ${
                marketMode === "US"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              US
            </button>
            <button
              onClick={() => onMarketSwitch("IN")}
              className={`px-2.5 py-1 transition-colors ${
                marketMode === "IN"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              IN
            </button>
          </div>

          <div className="hidden h-4 w-px bg-slate-700 sm:block" />
          <InstrumentSelector />
          <TimeframeSelector />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-3">
          <ThemeSelector />
          <EngineControls
            status={engineStatus}
            speed={speed}
            onToggle={onToggle}
            onSpeedChange={onSpeedChange}
          />
        </div>
      </header>

      {/* Grid */}
      <div className="min-h-0 flex-1">
        <PanelGrid />
      </div>

      {/* Status bar */}
      <StatusBar engineStatus={engineStatus} speed={speed} />
    </div>
  );
}
