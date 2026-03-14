import type { Tick, Candle, TimeFrame } from "./types.ts";
import { TIMEFRAME_MS } from "./types.ts";

export class CandleAggregator {
  private currentCandles = new Map<string, Candle>();

  getCandleTime(timestamp: number, timeFrame: TimeFrame): number {
    const ms = TIMEFRAME_MS[timeFrame];
    return Math.floor(timestamp / ms) * (ms / 1000);
  }

  processTick(
    tick: Tick,
    timeFrame: TimeFrame,
  ): { candle: Candle; isNew: boolean } {
    const key = `${tick.symbol}:${timeFrame}`;
    const candleTime = this.getCandleTime(tick.timestamp, timeFrame);
    const existing = this.currentCandles.get(key);

    if (existing && existing.time === candleTime) {
      // Update existing candle
      existing.high = Math.max(existing.high, tick.price);
      existing.low = Math.min(existing.low, tick.price);
      existing.close = tick.price;
      existing.volume += tick.volume;
      return { candle: { ...existing }, isNew: false };
    }

    // Start new candle
    const newCandle: Candle = {
      time: candleTime,
      open: tick.price,
      high: tick.price,
      low: tick.price,
      close: tick.price,
      volume: tick.volume,
    };
    this.currentCandles.set(key, newCandle);
    return { candle: { ...newCandle }, isNew: true };
  }
}
