import { useEffect, useState } from "react";
import { useMarketStore } from "../../stores/market-store.ts";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { activeInstruments } from "../../engine/constants.ts";
import { AnimatedNumber } from "../shared/AnimatedNumber.tsx";
import { getDecimalsForTick } from "../../lib/format.ts";
import { stddev, sma, ema, mean } from "../../lib/math.ts";
import type { Tick } from "../../engine/types.ts";

interface Stats {
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  volatility: number;
  vwap: number;
  sma20: number;
  sma50: number;
  ema12: number;
  bid: number;
  ask: number;
  spread: number;
  tickCount: number;
  maxDrawdown: number;
  avgVolume: number;
  rsi: number;
  sharpe: number;
  sortino: number;
  skewness: number;
  kurtosis: number;
  median: number;
  variance: number;
}

function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeStats(symbol: string): Stats {
  const inst = useMarketStore.getState().instruments[symbol];
  const instrument = activeInstruments().find((i) => i.symbol === symbol);
  const basePrice = instrument?.basePrice ?? 0;
  const empty: Stats = {
    price: basePrice, open: basePrice, high: basePrice, low: basePrice,
    change: 0, changePercent: 0, volatility: 0, vwap: basePrice,
    sma20: basePrice, sma50: basePrice, ema12: basePrice,
    bid: basePrice, ask: basePrice, spread: 0,
    tickCount: 0, maxDrawdown: 0, avgVolume: 0,
    rsi: 50, sharpe: 0, sortino: 0, skewness: 0, kurtosis: 0,
    median: basePrice, variance: 0,
  };

  if (!inst || !inst.lastTick) return empty;

  const ticks = inst.tickHistory.toArray();
  const prices = ticks.map((t: Tick) => t.price);
  const volumes = ticks.map((t: Tick) => t.volume);

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const open = prices[0];
  const current = inst.lastTick.price;
  const change = current - basePrice;
  const changePercent = (change / basePrice) * 100;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const vol = stddev(returns) * Math.sqrt(252 * 6.5 * 36);

  let sumPV = 0;
  let sumV = 0;
  for (let i = 0; i < prices.length; i++) {
    sumPV += prices[i] * volumes[i];
    sumV += volumes[i];
  }
  const vwap = sumV > 0 ? sumPV / sumV : current;

  let peak = prices[0];
  let maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  const totalVol = volumes.reduce((a, b) => a + b, 0);

  const rsi = computeRSI(prices);

  const meanReturn = returns.length > 0 ? mean(returns) : 0;
  const stdReturn = returns.length > 1 ? stddev(returns) : 1;
  const sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252 * 6.5 * 36) : 0;

  const downsideReturns = returns.filter((r) => r < 0);
  const downsideDev = downsideReturns.length > 1 ? stddev(downsideReturns) : stdReturn;
  const sortino = downsideDev > 0 ? (meanReturn / downsideDev) * Math.sqrt(252 * 6.5 * 36) : 0;

  let skewness = 0;
  if (returns.length > 2 && stdReturn > 0) {
    const n = returns.length;
    let sum3 = 0;
    for (const r of returns) sum3 += Math.pow((r - meanReturn) / stdReturn, 3);
    skewness = (n / ((n - 1) * (n - 2))) * sum3;
  }

  let kurtosis = 0;
  if (returns.length > 3 && stdReturn > 0) {
    const n = returns.length;
    let sum4 = 0;
    for (const r of returns) sum4 += Math.pow((r - meanReturn) / stdReturn, 4);
    kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum4 -
      (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sortedPrices.length / 2);
  const median = sortedPrices.length % 2 !== 0
    ? sortedPrices[mid]
    : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

  const variance = stdReturn * stdReturn;

  return {
    price: current,
    open,
    high,
    low,
    change,
    changePercent,
    volatility: vol,
    vwap,
    sma20: sma(prices, 20),
    sma50: prices.length >= 50 ? sma(prices, 50) : sma(prices, prices.length),
    ema12: ema(prices, 12),
    bid: inst.lastTick.bid,
    ask: inst.lastTick.ask,
    spread: inst.lastTick.ask - inst.lastTick.bid,
    tickCount: ticks.length,
    maxDrawdown: maxDD,
    avgVolume: totalVol / ticks.length,
    rsi,
    sharpe,
    sortino,
    skewness,
    kurtosis,
    median,
    variance,
  };
}

export function StatisticsPanel() {
  const symbol = useSelectionStore((s) => s.activeInstrument);
  const instrument = activeInstruments().find((i) => i.symbol === symbol);
  const decimals = getDecimalsForTick(instrument?.tickSize ?? 0.01);
  const [stats, setStats] = useState<Stats>(computeStats(symbol));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useMarketStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setStats(computeStats(symbol)), 500);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [symbol]);

  const isUp = stats.changePercent >= 0;

  return (
    <div className="h-full overflow-y-auto p-3 text-[11px]">
      {/* Price + Change header */}
      <div className="mb-2 flex items-baseline gap-2">
        <AnimatedNumber value={stats.price} decimals={decimals} className="text-sm font-semibold text-slate-100" />
        <span
          className="tabular-nums text-xs font-medium"
          style={{ color: isUp ? "#22c55e" : "#ef4444" }}
        >
          {isUp ? "+" : ""}{stats.change.toFixed(decimals)} ({isUp ? "+" : ""}{stats.changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* Price Data */}
      <div className="mb-2">
        <div className="mb-1 text-[9px] font-semibold uppercase text-slate-500">Price Data</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow label="Open" value={stats.open} decimals={decimals} />
          <StatRow label="High" value={stats.high} decimals={decimals} />
          <StatRow label="Low" value={stats.low} decimals={decimals} />
          <StatRow label="Median" value={stats.median} decimals={decimals} />
          <StatRow label="Bid" value={stats.bid} decimals={decimals} />
          <StatRow label="Ask" value={stats.ask} decimals={decimals} />
          <StatRow label="Spread" value={stats.spread} decimals={decimals + 1} />
          <StatRow label="VWAP" value={stats.vwap} decimals={decimals} />
        </div>
      </div>

      {/* Moving Averages */}
      <div className="mb-2">
        <div className="mb-1 text-[9px] font-semibold uppercase text-slate-500">Moving Averages</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow label="EMA(12)" value={stats.ema12} decimals={decimals} />
          <StatRow label="SMA(20)" value={stats.sma20} decimals={decimals} />
          <StatRow label="SMA(50)" value={stats.sma50} decimals={decimals} />
        </div>
      </div>

      {/* Risk & Performance */}
      <div className="mb-2">
        <div className="mb-1 text-[9px] font-semibold uppercase text-slate-500">Risk & Performance</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow label="Vol (ann)" value={stats.volatility * 100} decimals={1} suffix="%" />
          <StatRow label="Variance" value={stats.variance * 10000} decimals={4} suffix="bp²" />
          <StatRow label="Max DD" value={stats.maxDrawdown * 100} decimals={2} suffix="%" />
          <StatRow label="RSI(14)" value={stats.rsi} decimals={1} />
          <StatRow label="Sharpe" value={stats.sharpe} decimals={2} />
          <StatRow label="Sortino" value={stats.sortino} decimals={2} />
          <StatRow label="Skewness" value={stats.skewness} decimals={3} />
          <StatRow label="Kurtosis" value={stats.kurtosis} decimals={3} />
        </div>
      </div>

      {/* Volume */}
      <div>
        <div className="mb-1 text-[9px] font-semibold uppercase text-slate-500">Volume</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow label="Avg Vol" value={stats.avgVolume} decimals={0} />
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Ticks</span>
            <span className="text-slate-300 tabular-nums">{stats.tickCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  decimals,
  suffix,
}: {
  label: string;
  value: number;
  decimals: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <AnimatedNumber
        value={value}
        decimals={decimals}
        suffix={suffix}
        className="text-slate-300"
      />
    </div>
  );
}
