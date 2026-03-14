import type { Instrument, AnomalyType } from './types.ts';

export interface InjectionResult {
  multiplier: number;
  type: AnomalyType | null;
}

export class AnomalyInjector {
  // Poisson rate: average ~1 anomaly per 45 seconds at 100ms tick rate
  private lambda = 0.00025;

  maybeInject(instrument: Instrument): InjectionResult {
    void instrument;
    if (Math.random() > this.lambda) {
      return { multiplier: 1, type: null };
    }

    const roll = Math.random();

    if (roll < 0.35) {
      // Price spike: 3-5x return
      return {
        multiplier: 3 + Math.random() * 2,
        type: 'price_spike',
      };
    }

    if (roll < 0.6) {
      // Volume burst: handled separately in market engine
      return {
        multiplier: 1,
        type: 'volume_burst',
      };
    }

    if (roll < 0.8) {
      // Momentum shift: flip direction sharply
      return {
        multiplier: -(2 + Math.random() * 2),
        type: 'momentum_shift',
      };
    }

    // Correlation break: mildly unpredictable move
    return {
      multiplier: 1.5 + Math.random(),
      type: 'correlation_break',
    };
  }

  setRate(lambda: number): void {
    this.lambda = lambda;
  }
}
