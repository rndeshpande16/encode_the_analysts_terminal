export type MarketMode = "US" | "IN";

export interface Instrument {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
  drift: number;
  tickSize: number;
  avgVolume: number;
}

export interface FundamentalData {
  marketCap: string;
  peRatio: number;
  eps: number;
  dividendYield: number;
  pegRatio: number;
  revenue: string;
  profitMargin: number;
  debtToEquity: number;
  roe: number;
  beta: number;
  sector: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  analystBuy: number;   // percentage
  analystHold: number;  // percentage
  analystSell: number;  // percentage
  monthlyReturns: number[]; // last 12 months % returns
  targetPrice: number;
}

export interface TechnicalSignal {
  indicator: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  strength: number; // 0-1
}

export interface AnalysisResult {
  overall: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  score: number; // -100 to 100
  signals: TechnicalSignal[];
  summary: string;
}

export interface Tick {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  bid: number;
  ask: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  bids: OrderLevel[];
  asks: OrderLevel[];
  spread: number;
}

export type AnomalyType =
  | "price_spike"
  | "volume_burst"
  | "correlation_break"
  | "momentum_shift";

export interface Anomaly {
  id: string;
  symbol: string;
  type: AnomalyType;
  severity: number;
  zScore: number;
  timestamp: number;
  message: string;
}

export type TimeFrame =
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "4h"
  | "1D"
  | "5D"
  | "10D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "5Y"
  | "10Y"
  | "15Y"
  | "All";

export interface GBMState {
  price: number;
  momentum: number;
  revertTarget: number;
}

export interface EngineConfig {
  instruments: Instrument[];
  tickRate: number;
  onTick: (tick: Tick) => void;
  onBatch?: (ticks: Tick[]) => void;
  onOrderBook: (symbol: string, book: OrderBook) => void;
  onAnomaly: (anomaly: Anomaly) => void;
}

export const TIMEFRAME_MS: Record<TimeFrame, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1D": 86_400_000,
  "5D": 432_000_000,
  "10D": 864_000_000,
  "1M": 2_592_000_000,
  "3M": 7_776_000_000,
  "6M": 15_552_000_000,
  "1Y": 31_536_000_000,
  "5Y": 157_680_000_000,
  "10Y": 315_360_000_000,
  "15Y": 473_040_000_000,
  All: 631_152_000_000,
};

// Chart-friendly timeframes (used for candle aggregation in real-time)
export const REALTIME_TIMEFRAMES: TimeFrame[] = [
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "1D",
];

// All selectable timeframes
export const ALL_TIMEFRAMES: TimeFrame[] = [
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
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
