import type { TechnicalSignal, AnalysisResult } from "./types.ts";
import { mean, stddev, ema, sma } from "../lib/math.ts";

function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function computeMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macdLine = ema12 - ema26;
  // Simplified signal line
  const recentMacd: number[] = [];
  for (let i = Math.max(0, prices.length - 9); i < prices.length; i++) {
    const e12 = ema(prices.slice(0, i + 1), 12);
    const e26 = ema(prices.slice(0, i + 1), 26);
    recentMacd.push(e12 - e26);
  }
  const signalLine = ema(recentMacd, 9);
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

function computeBollingerBands(
  prices: number[],
  period = 20,
): { upper: number; middle: number; lower: number; percentB: number } {
  const slice = prices.slice(-period);
  const middle = mean(slice);
  const sd = stddev(slice);
  const upper = middle + 2 * sd;
  const lower = middle - 2 * sd;
  const current = prices[prices.length - 1];
  const percentB = sd > 0 ? (current - lower) / (upper - lower) : 0.5;
  return { upper, middle, lower, percentB };
}

function computeStochastic(
  prices: number[],
  period = 14,
): { k: number; d: number } {
  if (prices.length < period) return { k: 50, d: 50 };
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const current = prices[prices.length - 1];
  const k = high !== low ? ((current - low) / (high - low)) * 100 : 50;
  // Simplified %D (3-period SMA of %K)
  return { k, d: k };
}

export function analyzeTechnicals(
  prices: number[],
  volumes: number[],
): AnalysisResult {
  if (prices.length < 30) {
    return {
      overall: "neutral",
      score: 0,
      signals: [],
      summary: "Insufficient data for analysis",
    };
  }

  const signals: TechnicalSignal[] = [];
  const current = prices[prices.length - 1];

  // RSI
  const rsi = computeRSI(prices);
  signals.push({
    indicator: "RSI (14)",
    value: rsi,
    signal: rsi < 30 ? "buy" : rsi > 70 ? "sell" : "neutral",
    strength: rsi < 30 ? (30 - rsi) / 30 : rsi > 70 ? (rsi - 70) / 30 : 0,
  });

  // MACD
  const { histogram } = computeMACD(prices);
  signals.push({
    indicator: "MACD",
    value: histogram,
    signal: histogram > 0 ? "buy" : histogram < 0 ? "sell" : "neutral",
    strength: Math.min(
      Math.abs(histogram) / (Math.abs(current) * 0.001 + 0.0001),
      1,
    ),
  });

  // Bollinger Bands %B
  const bb = computeBollingerBands(prices);
  signals.push({
    indicator: "Bollinger %B",
    value: bb.percentB,
    signal: bb.percentB < 0.2 ? "buy" : bb.percentB > 0.8 ? "sell" : "neutral",
    strength:
      bb.percentB < 0.2
        ? (0.2 - bb.percentB) / 0.2
        : bb.percentB > 0.8
          ? (bb.percentB - 0.8) / 0.2
          : 0,
  });

  // Stochastic
  const stoch = computeStochastic(prices);
  signals.push({
    indicator: "Stochastic %K",
    value: stoch.k,
    signal: stoch.k < 20 ? "buy" : stoch.k > 80 ? "sell" : "neutral",
    strength:
      stoch.k < 20
        ? (20 - stoch.k) / 20
        : stoch.k > 80
          ? (stoch.k - 80) / 20
          : 0,
  });

  // SMA crossover (20 vs 50)
  if (prices.length >= 50) {
    const sma20 = sma(prices, 20);
    const sma50 = sma(prices, 50);
    const crossSignal =
      sma20 > sma50 ? "buy" : sma20 < sma50 ? "sell" : "neutral";
    signals.push({
      indicator: "SMA 20/50",
      value: (sma20 / sma50 - 1) * 100,
      signal: crossSignal as "buy" | "sell" | "neutral",
      strength: Math.min(Math.abs(sma20 / sma50 - 1) * 20, 1),
    });
  }

  // Volume trend
  if (volumes.length >= 20) {
    const recentVol = mean(volumes.slice(-5));
    const avgVol = mean(volumes.slice(-20));
    const volRatio = recentVol / (avgVol || 1);
    // High volume on up move = bullish, high volume on down move = bearish
    const priceDir =
      prices[prices.length - 1] > prices[prices.length - 6] ? 1 : -1;
    signals.push({
      indicator: "Volume Trend",
      value: volRatio,
      signal: volRatio > 1.5 ? (priceDir > 0 ? "buy" : "sell") : "neutral",
      strength: Math.min((volRatio - 1) / 2, 1),
    });
  }

  // Momentum (rate of change)
  if (prices.length >= 10) {
    const roc = (current / prices[prices.length - 10] - 1) * 100;
    signals.push({
      indicator: "Momentum (10)",
      value: roc,
      signal: roc > 2 ? "buy" : roc < -2 ? "sell" : "neutral",
      strength: Math.min(Math.abs(roc) / 5, 1),
    });
  }

  // Calculate score
  let score = 0;
  for (const s of signals) {
    const weight = s.signal === "buy" ? 1 : s.signal === "sell" ? -1 : 0;
    score += weight * s.strength * (100 / signals.length);
  }
  score = Math.round(Math.max(-100, Math.min(100, score)));

  let overall: AnalysisResult["overall"];
  if (score >= 50) overall = "strong_buy";
  else if (score >= 15) overall = "buy";
  else if (score <= -50) overall = "strong_sell";
  else if (score <= -15) overall = "sell";
  else overall = "neutral";

  const buyCount = signals.filter((s) => s.signal === "buy").length;
  const sellCount = signals.filter((s) => s.signal === "sell").length;
  const summary = `${buyCount} buy, ${sellCount} sell, ${signals.length - buyCount - sellCount} neutral signals`;

  return { overall, score, signals, summary };
}
