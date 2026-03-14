import { useEffect, useState, useRef, memo } from "react";
import clsx from "clsx";
import { useMarketStore } from "../../stores/market-store.ts";
import { activeInstruments } from "../../engine/constants.ts";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { useWatchlistStore } from "../../stores/watchlist-store.ts";
import { SparkLine } from "../shared/SparkLine.tsx";
import { formatPrice, formatVolume } from "../../lib/format.ts";
import type { Tick } from "../../engine/types.ts";

interface RowData {
  symbol: string;
  name: string;
  price: number;
  basePrice: number;
  change: number;
  changePercent: number;
  volume: number;
  sparkData: number[];
  tickSize: number;
}

function getRowData(symbols: string[]): RowData[] {
  const state = useMarketStore.getState();
  return symbols
    .map((sym) => {
      const inst = activeInstruments().find((i) => i.symbol === sym);
      if (!inst) return null;
      const is = state.instruments[sym];
      const lastTick = is?.lastTick;
      const price = lastTick?.price ?? inst.basePrice;
      const change = price - inst.basePrice;
      const changePercent = (change / inst.basePrice) * 100;
      const sparkData = is?.tickHistory
        ? is.tickHistory.lastN(50).map((t: Tick) => t.price)
        : [];

      return {
        symbol: inst.symbol,
        name: inst.name,
        price,
        basePrice: inst.basePrice,
        change,
        changePercent,
        volume: lastTick?.volume ?? 0,
        sparkData,
        tickSize: inst.tickSize,
      };
    })
    .filter((r): r is RowData => r !== null);
}

export function WatchlistPanel() {
  const watchlistSymbols = useWatchlistStore((s) => s.symbols);
  const addSymbol = useWatchlistStore((s) => s.addSymbol);
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol);
  const [rows, setRows] = useState<RowData[]>(() =>
    getRowData(watchlistSymbols),
  );
  const setActiveInstrument = useSelectionStore((s) => s.setActiveInstrument);
  const activeInstrument = useSelectionStore((s) => s.activeInstrument);
  const [showAdd, setShowAdd] = useState(false);

  // Symbols not yet in the watchlist
  const availableToAdd = activeInstruments().filter(
    (i) => !watchlistSymbols.includes(i.symbol),
  );

  useEffect(() => {
    setRows(getRowData(watchlistSymbols));

    let frameId: ReturnType<typeof setTimeout>;
    const unsub = useMarketStore.subscribe(() => {
      clearTimeout(frameId);
      frameId = setTimeout(() => {
        setRows(getRowData(watchlistSymbols));
      }, 250);
    });
    return () => {
      unsub();
      clearTimeout(frameId);
    };
  }, [watchlistSymbols]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full min-w-0 text-xs">
          <thead className="sticky top-0 bg-[var(--color-terminal-panel)]">
            <tr className="text-left text-[10px] text-slate-500 uppercase">
              <th className="px-2 py-1">Symbol</th>
              <th className="px-2 py-1 text-right">Price</th>
              <th className="px-2 py-1 text-right">Chg%</th>
              <th className="px-2 py-1 text-right">Vol</th>
              <th className="px-2 py-1 text-center">Trend</th>
              <th className="w-6 px-1 py-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <WatchlistRow
                key={row.symbol}
                row={row}
                isActive={row.symbol === activeInstrument}
                onClick={() => setActiveInstrument(row.symbol)}
                onRemove={() => removeSymbol(row.symbol)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add button / dropdown */}
      {availableToAdd.length > 0 && (
        <div className="relative border-t border-[var(--color-terminal-border)] px-2 py-1">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex w-full items-center justify-center gap-1 rounded py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-slate-700/40 hover:text-slate-300"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2v8M2 6h8" />
            </svg>
            Add instrument
          </button>

          {showAdd && (
            <div className="absolute bottom-full left-0 z-50 mb-1 w-full rounded-md border border-slate-700 bg-[#111827] p-1 shadow-xl">
              {availableToAdd.map((inst) => (
                <button
                  key={inst.symbol}
                  onClick={() => {
                    addSymbol(inst.symbol);
                    setShowAdd(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-slate-300 transition-colors hover:bg-slate-700/50"
                >
                  <span className="w-14 font-medium">{inst.symbol}</span>
                  <span className="text-slate-500">{inst.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const WatchlistRow = memo(function WatchlistRow({
  row,
  isActive,
  onClick,
  onRemove,
}: {
  row: RowData;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const isUp = row.changePercent >= 0;
  const prevPriceRef = useRef(row.price);
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (row.price > prevPriceRef.current) {
      setFlashClass("animate-row-flash-green");
    } else if (row.price < prevPriceRef.current) {
      setFlashClass("animate-row-flash-red");
    }
    prevPriceRef.current = row.price;

    const timer = setTimeout(() => setFlashClass(""), 800);
    return () => clearTimeout(timer);
  }, [row.price]);

  return (
    <tr
      onClick={onClick}
      className={clsx(
        "cursor-pointer transition-colors hover:bg-slate-800/50",
        isActive && "bg-blue-500/10",
        flashClass,
      )}
    >
      <td className="px-2 py-1">
        <div className="font-medium text-slate-200">{row.symbol}</div>
      </td>
      <td className="px-2 py-1 text-right tabular-nums text-slate-200">
        {formatPrice(row.price, row.tickSize)}
      </td>
      <td
        className={clsx(
          "px-2 py-1 text-right tabular-nums",
          isUp
            ? "text-[var(--color-positive)]"
            : "text-[var(--color-negative)]",
        )}
      >
        {isUp ? "+" : ""}
        {row.changePercent.toFixed(2)}%
      </td>
      <td className="px-2 py-1 text-right text-slate-400 tabular-nums">
        {formatVolume(row.volume)}
      </td>
      <td className="px-2 py-1 text-center">
        <SparkLine data={row.sparkData} width={50} height={16} />
      </td>
      <td className="px-1 py-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex h-4 w-4 items-center justify-center rounded text-[10px] text-slate-600 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="Remove from watchlist"
        >
          ×
        </button>
      </td>
    </tr>
  );
});
