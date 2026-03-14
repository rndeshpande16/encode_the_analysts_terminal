import type {
  Instrument,
  Tick,
  GBMState,
  EngineConfig,
  OrderBook,
} from "./types.ts";
import { initGBMState, stepGBM } from "./gbm.ts";
import { generateOrderBook } from "./order-book-sim.ts";
import { AnomalyInjector } from "./anomaly-injector.ts";
import { AnomalyDetector } from "./anomaly-detector.ts";

export class MarketEngine {
  private instruments: Map<
    string,
    { instrument: Instrument; state: GBMState }
  > = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickRate: number;
  private speedMultiplier = 1;
  private onTick: EngineConfig["onTick"];
  private onBatch: EngineConfig["onBatch"];
  private onOrderBook: EngineConfig["onOrderBook"];
  private onAnomaly: EngineConfig["onAnomaly"];
  private anomalyInjector = new AnomalyInjector();
  private anomalyDetector = new AnomalyDetector();
  private orderBookCounters = new Map<string, number>();

  constructor(config: EngineConfig) {
    this.tickRate = config.tickRate;
    this.onTick = config.onTick;
    this.onBatch = config.onBatch;
    this.onOrderBook = config.onOrderBook;
    this.onAnomaly = config.onAnomaly;

    for (const inst of config.instruments) {
      this.instruments.set(inst.symbol, {
        instrument: inst,
        state: initGBMState(inst),
      });
    }
  }

  /**
   * Generate synthetic historical ticks before starting the live feed.
   * Uses batch processing for a single state update, avoiding thousands of re-renders.
   *
   * @param count Number of historical ticks per instrument (default 500)
   * @param intervalMs Simulated time gap between historical ticks (default 10000ms = 10s)
   */
  generateWarmup(count = 500, intervalMs = 10_000): void {
    const now = Date.now();
    const startTime = now - count * intervalMs;
    const allTicks: Tick[] = [];

    for (let i = 0; i < count; i++) {
      const tickTime = startTime + i * intervalMs;
      const entries = Array.from(this.instruments.values());

      for (let j = 0; j < entries.length; j++) {
        const { instrument, state } = entries[j];

        const dt = intervalMs * this.speedMultiplier;
        const { nextState, tick: partialTick } = stepGBM(
          state,
          instrument,
          dt,
          1,
        );

        const tick: Tick = {
          ...partialTick,
          timestamp: tickTime + j * 5,
        };

        this.instruments.set(instrument.symbol, {
          instrument,
          state: nextState,
        });

        allTicks.push(tick);
      }
    }

    // Single batch update — one state notification for all warmup data
    if (this.onBatch) {
      this.onBatch(allTicks);
    } else {
      for (const tick of allTicks) {
        this.onTick(tick);
      }
    }

    // Generate initial order books for all instruments
    for (const { instrument, state } of this.instruments.values()) {
      const book: OrderBook = generateOrderBook(
        state.price,
        instrument.tickSize,
        Math.round(instrument.avgVolume * 0.3),
      );
      this.onOrderBook(instrument.symbol, book);
    }
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), this.tickRate);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.start();
  }

  setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
    this.tickRate = Math.max(20, 100 / multiplier);
    if (this.intervalId !== null) {
      this.stop();
      this.start();
    }
  }

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  private tick(): void {
    const now = Date.now();
    const instruments = Array.from(this.instruments.values());

    for (let i = 0; i < instruments.length; i++) {
      const { instrument, state } = instruments[i];

      // Anomaly injection
      const injection = this.anomalyInjector.maybeInject(instrument);
      const anomalyMultiplier = injection.multiplier;

      // GBM step
      const dt = this.tickRate * this.speedMultiplier;
      const { nextState, tick: partialTick } = stepGBM(
        state,
        instrument,
        dt,
        anomalyMultiplier,
      );

      // Volume burst injection
      let volume = partialTick.volume;
      if (injection.type === "volume_burst") {
        volume = Math.round(volume * (5 + Math.random() * 15));
      }

      const tick: Tick = {
        ...partialTick,
        volume,
        timestamp: now + i * 5,
      };

      instruments[i] = { instrument, state: nextState };
      this.instruments.set(instrument.symbol, { instrument, state: nextState });

      // Fire tick callback
      this.onTick(tick);

      // Anomaly detection
      const anomaly = this.anomalyDetector.check(tick);
      if (anomaly) {
        this.onAnomaly(anomaly);
      }

      // Update order book every 3 ticks per instrument
      const obCount = (this.orderBookCounters.get(instrument.symbol) ?? 0) + 1;
      this.orderBookCounters.set(instrument.symbol, obCount);
      if (obCount % 3 === 0) {
        const book: OrderBook = generateOrderBook(
          tick.price,
          instrument.tickSize,
          Math.round(instrument.avgVolume * 0.3),
        );
        this.onOrderBook(instrument.symbol, book);
      }
    }
  }
}
