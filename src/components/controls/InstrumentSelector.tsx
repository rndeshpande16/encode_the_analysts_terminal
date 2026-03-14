import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { activeInstruments } from "../../engine/constants.ts";
import { useSelectionStore } from "../../stores/selection-store.ts";

export function InstrumentSelector() {
  const active = useSelectionStore((s) => s.activeInstrument);
  const setActive = useSelectionStore((s) => s.setActiveInstrument);
  // Re-derive list when market mode changes
  const marketMode = useSelectionStore((s) => s.marketMode);
  const allItems = activeInstruments().map((inst) => ({
    symbol: inst.symbol,
    name: inst.name,
  }));

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.symbol.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (symbol: string) => {
    setActive(symbol);
    setQuery("");
    setOpen(false);
  };

  const activeInstrument = allItems.find((i) => i.symbol === active);

  // suppress unused var lint — marketMode is read so the component re-renders
  void marketMode;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex items-center gap-1.5 rounded border border-[var(--color-terminal-border)] bg-[var(--color-terminal-panel)] px-2 py-0.5 text-xs text-slate-300 transition-colors hover:border-slate-500"
      >
        <span className="font-medium">{active}</span>
        <span className="hidden text-slate-500 sm:inline">
          {activeInstrument?.name}
        </span>
        <svg
          className={clsx(
            "h-3 w-3 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-slate-700 bg-[#111827] shadow-xl">
          <div className="border-b border-slate-700 p-1.5">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or name..."
              className="w-full rounded bg-[var(--color-terminal-panel)] px-2 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  handleSelect(filtered[0].symbol);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">No matches</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  className={clsx(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-700/50",
                    active === item.symbol
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-slate-300",
                  )}
                >
                  <span className="w-20 font-medium">{item.symbol}</span>
                  <span className="truncate text-slate-500">{item.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
