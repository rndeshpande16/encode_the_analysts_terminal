import type { TimeFrame, Candle } from "../engine/types.ts";
import { TIMEFRAME_MS } from "../engine/types.ts";
import { getYahooMap, getActiveMarket } from "../engine/constants.ts";

/**
 * Maps our timeframes to Yahoo Finance range + interval params.
 */
function getYahooParams(tf: TimeFrame): { range: string; interval: string } {
  switch (tf) {
    case "1D":
      return { range: "1mo", interval: "1d" };
    case "5D":
      return { range: "3mo", interval: "1d" };
    case "10D":
      return { range: "6mo", interval: "1d" };
    case "1M":
      return { range: "1y", interval: "1d" };
    case "3M":
      return { range: "2y", interval: "1wk" };
    case "6M":
      return { range: "5y", interval: "1wk" };
    case "1Y":
      return { range: "5y", interval: "1mo" };
    case "5Y":
      return { range: "10y", interval: "1mo" };
    case "10Y":
      return { range: "max", interval: "1mo" };
    case "15Y":
      return { range: "max", interval: "1mo" };
    case "All":
      return { range: "max", interval: "1mo" };
    default:
      return { range: "1mo", interval: "1d" };
  }
}

// In-memory cache to avoid repeated fetches
const cache = new Map<string, { data: Candle[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Returns true if this timeframe should use real API data.
 */
export function isApiTimeframe(tf: TimeFrame): boolean {
  return TIMEFRAME_MS[tf] >= TIMEFRAME_MS["1D"];
}

/**
 * Resolves Yahoo Finance symbol from internal symbol using the active market's map.
 */
export function toYahooSymbol(symbol: string): string {
  const map = getYahooMap(getActiveMarket());
  return map[symbol] ?? symbol;
}

/**
 * Fetches historical OHLCV data from Yahoo Finance for daily+ timeframes.
 * Uses corsproxy.io to bypass CORS restrictions.
 * Returns sorted candle array or null on failure.
 */
export async function fetchHistoricalData(
  symbol: string,
  timeFrame: TimeFrame,
): Promise<Candle[] | null> {
  const cacheKey = `${getActiveMarket()}:${symbol}:${timeFrame}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const yahooSymbol = toYahooSymbol(symbol);
  const { range, interval } = getYahooParams(timeFrame);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0];
    if (!quote || timestamps.length === 0) return null;

    const opens: (number | null)[] = quote.open ?? [];
    const highs: (number | null)[] = quote.high ?? [];
    const lows: (number | null)[] = quote.low ?? [];
    const closes: (number | null)[] = quote.close ?? [];
    const volumes: (number | null)[] = quote.volume ?? [];

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      const v = volumes[i];
      // Skip null entries (market holidays, missing data)
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({
        time: timestamps[i], // Already in epoch seconds
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v ?? 0,
      });
    }

    // Sort ascending by time (required by lightweight-charts)
    candles.sort((a, b) => a.time - b.time);

    cache.set(cacheKey, { data: candles, ts: Date.now() });
    return candles;
  } catch {
    return null;
  }
}
