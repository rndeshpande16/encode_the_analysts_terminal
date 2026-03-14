import { useRef, useEffect, useState } from "react";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { useMarketStore } from "../../stores/market-store.ts";
import { useLightweightChart } from "../../hooks/use-lightweight-chart.ts";
import { activeInstruments } from "../../engine/constants.ts";
import { formatPrice } from "../../lib/format.ts";
import { TIMEFRAME_MS } from "../../engine/types.ts";
import {
  fetchHistoricalData,
} from "../../lib/yahoo-finance.ts";

const DAY_MS = TIMEFRAME_MS["1D"];

/**
 * For intraday timeframes (< 1D): show the day's net P/L (base price -> current).
 */
function getIntradayPnL(
  symbol: string,
): { returnPct: number; pnl: number } | null {
  const inst = useMarketStore.getState().instruments[symbol];
  const instrument = activeInstruments().find((i) => i.symbol === symbol);
  if (!inst || !instrument || !inst.lastTick) return null;

  const current = inst.lastTick.price;
  const base = instrument.basePrice;
  const pnl = current - base;
  const returnPct = (pnl / base) * 100;
  return { returnPct, pnl };
}

export function PriceChartPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const symbol = useSelectionStore((s) => s.activeInstrument);
  const timeFrame = useSelectionStore((s) => s.activeTimeFrame);
  const instrument = activeInstruments().find((i) => i.symbol === symbol);
  const tickSize = instrument?.tickSize ?? 0.01;

  useLightweightChart(containerRef, symbol, timeFrame);

  const [returns, setReturns] = useState<{
    returnPct: number;
    pnl: number;
  } | null>(null);

  const isIntraday = TIMEFRAME_MS[timeFrame] < DAY_MS;

  useEffect(() => {
    if (isIntraday) {
      // Poll the live store for intraday P/L
      setReturns(getIntradayPnL(symbol));
      const interval = setInterval(() => {
        setReturns(getIntradayPnL(symbol));
      }, 500);
      return () => clearInterval(interval);
    }

    // For API timeframes (>= 1D): fetch cached historical data and compute P/L
    let cancelled = false;

    async function loadApiPnL() {
      const candles = await fetchHistoricalData(symbol, timeFrame);
      if (cancelled || !candles || candles.length === 0) return;

      const firstOpen = candles[0].open;
      const lastClose = candles[candles.length - 1].close;
      const pnl = lastClose - firstOpen;
      const returnPct = (pnl / firstOpen) * 100;
      setReturns({ returnPct, pnl });
    }

    loadApiPnL();

    return () => {
      cancelled = true;
    };
  }, [symbol, timeFrame, isIntraday]);

  const isUp = returns ? returns.pnl >= 0 : true;
  const label = isIntraday ? "Day P/L" : `${timeFrame} P/L`;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {returns && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-2 rounded bg-[rgba(10,14,23,0.8)] px-2 py-1 text-[11px]">
          <span className="text-[9px] text-slate-500">{label}</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: isUp ? "#22c55e" : "#ef4444" }}
          >
            {isUp ? "+" : ""}
            {returns.returnPct.toFixed(2)}%
          </span>
          <span className="text-slate-500">|</span>
          <span
            className="tabular-nums"
            style={{ color: isUp ? "#22c55e" : "#ef4444" }}
          >
            {isUp ? "+" : ""}
            {formatPrice(returns.pnl, tickSize)} /share
          </span>
        </div>
      )}
    </div>
  );
}
