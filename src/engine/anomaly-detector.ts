import type { Tick, Anomaly, AnomalyType } from './types.ts';
import { RingBuffer } from '../lib/ring-buffer.ts';
import { mean, stddev, zScore, ema } from '../lib/math.ts';

const WINDOW_SIZE = 100;
const WARMUP_SIZE = 50;
const COOLDOWN_MS = 10_000; // 10s cooldown per symbol+type

export class AnomalyDetector {
  private returns = new Map<string, RingBuffer<number>>();
  private volumes = new Map<string, RingBuffer<number>>();
  private prevPrices = new Map<string, number>();
  private lastAnomaly = new Map<string, number>(); // key → timestamp
  private counter = 0;

  check(tick: Tick): Anomaly | null {
    const prevPrice = this.prevPrices.get(tick.symbol);
    this.prevPrices.set(tick.symbol, tick.price);

    if (prevPrice === undefined) return null;

    // Initialize buffers if needed
    if (!this.returns.has(tick.symbol)) {
      this.returns.set(tick.symbol, new RingBuffer(WINDOW_SIZE));
      this.volumes.set(tick.symbol, new RingBuffer(WINDOW_SIZE));
    }

    const returnVal = (tick.price - prevPrice) / prevPrice;
    this.returns.get(tick.symbol)!.push(returnVal);
    this.volumes.get(tick.symbol)!.push(tick.volume);

    const returnBuf = this.returns.get(tick.symbol)!;
    const volumeBuf = this.volumes.get(tick.symbol)!;

    // Warm-up guard
    if (returnBuf.length < WARMUP_SIZE) return null;

    const returnArr = returnBuf.toArray();
    const volumeArr = volumeBuf.toArray();

    // Check #1: Price z-score
    const returnMean = mean(returnArr);
    const returnStd = stddev(returnArr);
    const returnZ = zScore(returnVal, returnMean, returnStd);

    if (Math.abs(returnZ) > 2.5) {
      return this.emitIfCool(tick, 'price_spike', Math.abs(returnZ), returnZ);
    }

    // Check #2: Volume ratio
    const volMean = mean(volumeArr);
    const volRatio = tick.volume / (volMean || 1);

    if (volRatio > 3.0) {
      return this.emitIfCool(tick, 'volume_burst', Math.min(volRatio / 5, 1), volRatio);
    }

    // Check #3: Momentum shift (fast EMA crosses slow EMA with gap)
    if (returnArr.length >= 30) {
      const fastEma = ema(returnArr, 10);
      const slowEma = ema(returnArr, 30);
      const gap = Math.abs(fastEma - slowEma);
      const gapZ = gap / (returnStd || 0.001);

      if (gapZ > 2.0) {
        return this.emitIfCool(tick, 'momentum_shift', Math.min(gapZ / 4, 1), gapZ);
      }
    }

    return null;
  }

  private emitIfCool(
    tick: Tick,
    type: AnomalyType,
    severity: number,
    zScoreVal: number,
  ): Anomaly | null {
    const key = `${tick.symbol}:${type}`;
    const lastTime = this.lastAnomaly.get(key) ?? 0;

    if (tick.timestamp - lastTime < COOLDOWN_MS) return null;

    this.lastAnomaly.set(key, tick.timestamp);
    this.counter++;

    const messages: Record<AnomalyType, string> = {
      price_spike: `Unusual price movement on ${tick.symbol}`,
      volume_burst: `Volume surge detected on ${tick.symbol}`,
      correlation_break: `${tick.symbol} diverging from expected pattern`,
      momentum_shift: `Momentum reversal forming on ${tick.symbol}`,
    };

    return {
      id: `anomaly-${this.counter}-${Date.now()}`,
      symbol: tick.symbol,
      type,
      severity: Math.min(severity, 1),
      zScore: zScoreVal,
      timestamp: tick.timestamp,
      message: messages[type],
    };
  }
}
