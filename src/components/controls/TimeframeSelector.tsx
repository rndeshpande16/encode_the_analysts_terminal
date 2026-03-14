import { useState } from "react";
import clsx from "clsx";
import type { TimeFrame } from "../../engine/types.ts";
import { useSelectionStore } from "../../stores/selection-store.ts";

const SHORT_TF: TimeFrame[] = ["1m", "5m", "15m", "1h", "4h"];
const LONG_TF: TimeFrame[] = [
  "1D",
  "5D",
  "10D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "10Y",
  "15Y",
  "All",
];

export function TimeframeSelector() {
  const active = useSelectionStore((s) => s.activeTimeFrame);
  const setActive = useSelectionStore((s) => s.setActiveTimeFrame);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative flex flex-wrap items-center gap-0.5">
      {SHORT_TF.map((tf) => (
        <TFButton key={tf} tf={tf} active={active} onSelect={setActive} />
      ))}
      <div className="mx-0.5 hidden h-3 w-px bg-slate-700 sm:block" />
      <TFButton tf="1D" active={active} onSelect={setActive} />
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          expanded
            ? "bg-slate-700 text-slate-200"
            : "text-slate-500 hover:text-slate-300",
        )}
      >
        More
      </button>

      {expanded && (
        <div className="absolute top-full left-0 z-50 mt-1 flex flex-wrap gap-0.5 rounded-md border border-slate-700 bg-[#111827] p-1.5 shadow-xl">
          {LONG_TF.map((tf) => (
            <TFButton
              key={tf}
              tf={tf}
              active={active}
              onSelect={(t) => {
                setActive(t);
                setExpanded(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TFButton({
  tf,
  active,
  onSelect,
}: {
  tf: TimeFrame;
  active: TimeFrame;
  onSelect: (tf: TimeFrame) => void;
}) {
  return (
    <button
      onClick={() => onSelect(tf)}
      className={clsx(
        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
        active === tf
          ? "bg-blue-500/20 text-blue-400"
          : "text-slate-500 hover:text-slate-300",
      )}
    >
      {tf}
    </button>
  );
}
