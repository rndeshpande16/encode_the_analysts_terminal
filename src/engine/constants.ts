import type { Instrument, FundamentalData, MarketMode } from "./types.ts";
import { getInstruments, getFundamentals } from "./markets/index.ts";

export {
  getInstruments,
  getFundamentals,
  getDefaultSymbol,
  getCurrencySymbol,
  getYahooMap,
} from "./markets/index.ts";

// ── Mutable cache for the currently-active market ──────────────────────
let _cachedMode: MarketMode = "US";
let _cachedInstruments: Instrument[] = getInstruments("US");
let _cachedFundamentals: Record<string, FundamentalData> = getFundamentals("US");

/** Call this when the user toggles market mode. */
export function setActiveMarket(mode: MarketMode) {
  _cachedMode = mode;
  _cachedInstruments = getInstruments(mode);
  _cachedFundamentals = getFundamentals(mode);
}

export function getActiveMarket(): MarketMode {
  return _cachedMode;
}

/**
 * Drop-in replacements for the old static `INSTRUMENTS` / `FUNDAMENTALS` constants.
 * Every call returns the data for the currently-active market.
 */
export function activeInstruments(): Instrument[] {
  return _cachedInstruments;
}

export function activeFundamentals(): Record<string, FundamentalData> {
  return _cachedFundamentals;
}

// ── Engine / capacity constants (unchanged) ────────────────────────────
export const DEFAULT_TICK_RATE = 100;
export const CANDLE_CAPACITIES = 500;
export const TICK_HISTORY_CAPACITY = 2000;
export const ANOMALY_HISTORY_CAPACITY = 50;
export const ORDER_BOOK_LEVELS = 10;
