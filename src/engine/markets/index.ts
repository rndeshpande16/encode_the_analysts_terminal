import type { Instrument, FundamentalData, MarketMode } from "../types.ts";
import { US_INSTRUMENTS, US_FUNDAMENTALS, US_YAHOO_MAP } from "./us-market.ts";
import { IN_INSTRUMENTS, IN_FUNDAMENTALS, IN_YAHOO_MAP } from "./in-market.ts";

export function getInstruments(mode: MarketMode): Instrument[] {
  return mode === "US" ? US_INSTRUMENTS : IN_INSTRUMENTS;
}

export function getFundamentals(
  mode: MarketMode,
): Record<string, FundamentalData> {
  return mode === "US" ? US_FUNDAMENTALS : IN_FUNDAMENTALS;
}

export function getYahooMap(mode: MarketMode): Record<string, string> {
  return mode === "US" ? US_YAHOO_MAP : IN_YAHOO_MAP;
}

export function getDefaultSymbol(mode: MarketMode): string {
  return mode === "US" ? "AAPL" : "RELIANCE";
}

export function getCurrencySymbol(mode: MarketMode): string {
  return mode === "US" ? "$" : "₹";
}
