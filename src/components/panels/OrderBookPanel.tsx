import { useEffect, useState } from "react";
import { useMarketStore } from "../../stores/market-store.ts";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { activeInstruments } from "../../engine/constants.ts";
import { formatPrice } from "../../lib/format.ts";
import type { OrderBook } from "../../engine/types.ts";

export function OrderBookPanel() {
  const symbol = useSelectionStore((s) => s.activeInstrument);
  const [book, setBook] = useState<OrderBook>({
    bids: [],
    asks: [],
    spread: 0,
  });

  const instrument = activeInstruments().find((i) => i.symbol === symbol);
  const tickSize = instrument?.tickSize ?? 0.01;

  useEffect(() => {
    // Read initial state
    const inst = useMarketStore.getState().instruments[symbol];
    if (inst?.orderBook && inst.orderBook.bids.length > 0) {
      setBook({ ...inst.orderBook });
    }

    // Poll at a fixed interval instead of debouncing every state change.
    // At high tick rates the debounce (clearTimeout on every tick) would
    // starve and never fire because new ticks arrive faster than the delay.
    const interval = setInterval(() => {
      const inst = useMarketStore.getState().instruments[symbol];
      if (inst?.orderBook && inst.orderBook.bids.length > 0) {
        setBook({ ...inst.orderBook });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [symbol]);

  const maxBidTotal =
    book.bids.length > 0 ? book.bids[book.bids.length - 1].total : 1;
  const maxAskTotal =
    book.asks.length > 0 ? book.asks[book.asks.length - 1].total : 1;

  if (book.bids.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-600">
        Waiting for order book data...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-2 text-[11px]">
      <div className="flex items-center justify-between px-1 pb-1 text-[9px] text-slate-500 uppercase">
        <span>Price</span>
        <span>Size</span>
      </div>

      {/* Asks (reversed so best ask is at bottom) */}
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-px overflow-hidden">
        {[...book.asks].reverse().map((level, i) => (
          <div
            key={`ask-${i}`}
            className="relative flex items-center justify-between px-1 py-0.5"
          >
            <div
              className="absolute inset-y-0 right-0"
              style={{
                width: `${(level.total / maxAskTotal) * 100}%`,
                backgroundColor: "rgba(239, 68, 68, 0.12)",
              }}
            />
            <span className="relative z-10 tabular-nums" style={{ color: "#ef4444" }}>
              {formatPrice(level.price, tickSize)}
            </span>
            <span className="relative z-10 text-slate-400 tabular-nums">
              {level.size.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Buy/Sell Proportion Bar */}
      {(() => {
        const totalBidSize = book.bids.reduce((s, l) => s + l.size, 0);
        const totalAskSize = book.asks.reduce((s, l) => s + l.size, 0);
        const total = totalBidSize + totalAskSize;
        const buyPct = total > 0 ? (totalBidSize / total) * 100 : 50;
        const sellPct = total > 0 ? (totalAskSize / total) * 100 : 50;
        return (
          <div className="mx-1 my-1">
            <div className="mb-0.5 flex justify-between text-[9px]">
              <span style={{ color: "#22c55e" }}>Buy {buyPct.toFixed(1)}%</span>
              <span style={{ color: "#ef4444" }}>Sell {sellPct.toFixed(1)}%</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full">
              <div
                style={{
                  width: `${buyPct}%`,
                  backgroundColor: "rgba(34, 197, 94, 0.6)",
                }}
              />
              <div
                style={{
                  width: `${sellPct}%`,
                  backgroundColor: "rgba(239, 68, 68, 0.6)",
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Spread */}
      <div className="my-1 flex items-center justify-center border-y border-slate-700 py-1.5 text-[10px]">
        <span className="text-slate-500">Spread</span>
        <span className="ml-2 font-medium text-slate-300 tabular-nums">
          {formatPrice(book.spread, tickSize)}
        </span>
      </div>

      {/* Bids */}
      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden">
        {book.bids.map((level, i) => (
          <div
            key={`bid-${i}`}
            className="relative flex items-center justify-between px-1 py-0.5"
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${(level.total / maxBidTotal) * 100}%`,
                backgroundColor: "rgba(34, 197, 94, 0.12)",
              }}
            />
            <span className="relative z-10 tabular-nums" style={{ color: "#22c55e" }}>
              {formatPrice(level.price, tickSize)}
            </span>
            <span className="relative z-10 text-slate-400 tabular-nums">
              {level.size.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
