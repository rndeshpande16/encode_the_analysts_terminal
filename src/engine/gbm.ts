import type { GBMState, Instrument, Tick } from './types.ts';
import { normalRandom, clamp } from '../lib/math.ts';

const SECONDS_PER_YEAR = 252 * 6.5 * 3600; // ~252 trading days, 6.5 hours each

export function initGBMState(instrument: Instrument): GBMState {
  return {
    price: instrument.basePrice,
    momentum: 0,
    revertTarget: instrument.basePrice,
  };
}

export function stepGBM(
  state: GBMState,
  instrument: Instrument,
  dt: number,
  anomalyMultiplier = 1,
): { nextState: GBMState; tick: Omit<Tick, 'timestamp'> } {
  const dtYears = dt / 1000 / SECONDS_PER_YEAR;
  const sqrtDt = Math.sqrt(dtYears);

  // Base GBM step
  const z = normalRandom();
  let logReturn = instrument.drift * dtYears + instrument.volatility * sqrtDt * z;

  // Apply anomaly multiplier
  logReturn *= anomalyMultiplier;

  // Momentum component (short-term autocorrelation)
  const momentumDecay = 0.95;
  const momentumContribution = state.momentum * 0.1 * dtYears;
  logReturn += momentumContribution;

  // Mean reversion pull
  const revertStrength = 0.05;
  const deviation = (state.price - state.revertTarget) / state.revertTarget;
  logReturn -= revertStrength * deviation * dtYears * 100;

  // Apply return
  const newPrice = state.price * Math.exp(logReturn);

  // Snap to tick size grid
  const snappedPrice = Math.round(newPrice / instrument.tickSize) * instrument.tickSize;
  const finalPrice = Math.max(snappedPrice, instrument.tickSize);

  // Volume proportional to |return| with randomness
  const absReturn = Math.abs(logReturn);
  const volume = Math.round(
    instrument.avgVolume * (1 + absReturn * 50 + Math.random() * 0.5),
  );

  // Spread
  const spreadMultiplier = 1 + Math.random() * 2;
  const halfSpread = (instrument.tickSize * spreadMultiplier) / 2;
  const bid = Math.round((finalPrice - halfSpread) / instrument.tickSize) * instrument.tickSize;
  const ask = Math.round((finalPrice + halfSpread) / instrument.tickSize) * instrument.tickSize;

  // Update momentum (exponential moving average of returns)
  const newMomentum = state.momentum * momentumDecay + logReturn * (1 - momentumDecay);

  // Slowly update revert target toward current price
  const revertAlpha = 0.001;
  const newRevertTarget = state.revertTarget * (1 - revertAlpha) + finalPrice * revertAlpha;

  return {
    nextState: {
      price: finalPrice,
      momentum: clamp(newMomentum, -0.1, 0.1),
      revertTarget: newRevertTarget,
    },
    tick: {
      symbol: instrument.symbol,
      price: finalPrice,
      volume,
      bid: Math.max(bid, instrument.tickSize),
      ask: Math.max(ask, instrument.tickSize * 2),
    },
  };
}
