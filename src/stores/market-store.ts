import { create } from "zustand";
import type { Tick, Candle, OrderBook, TimeFrame } from "../engine/types.ts";
import { ALL_TIMEFRAMES } from "../engine/types.ts";
import { RingBuffer } from "../lib/ring-buffer.ts";
import { CandleAggregator } from "../engine/candle-aggregator.ts";
import {
  TICK_HISTORY_CAPACITY,
  CANDLE_CAPACITIES,
} from "../engine/constants.ts";

export interface InstrumentState {
  lastTick: Tick | null;
  candles: Map<TimeFrame, RingBuffer<Candle>>;
  orderBook: OrderBook;
  tickHistory: RingBuffer<Tick>;
}

interface MarketState {
  instruments: Record<string, InstrumentState>;
  tickCount: number;
  candleAggregator: CandleAggregator;

  processTick: (tick: Tick) => void;
  processBatch: (ticks: Tick[]) => void;
  updateOrderBook: (symbol: string, book: OrderBook) => void;
  initInstrument: (symbol: string) => void;
  reset: () => void;
}

const TIMEFRAMES = ALL_TIMEFRAMES;

function createInstrumentState(): InstrumentState {
  const candles = new Map<TimeFrame, RingBuffer<Candle>>();
  for (const tf of TIMEFRAMES) {
    candles.set(tf, new RingBuffer<Candle>(CANDLE_CAPACITIES));
  }
  return {
    lastTick: null,
    candles,
    orderBook: { bids: [], asks: [], spread: 0 },
    tickHistory: new RingBuffer<Tick>(TICK_HISTORY_CAPACITY),
  };
}

function applyTickToInstrument(
  inst: InstrumentState,
  tick: Tick,
  aggregator: CandleAggregator,
): void {
  inst.tickHistory.push(tick);
  inst.lastTick = tick;

  for (const tf of TIMEFRAMES) {
    const { candle, isNew } = aggregator.processTick(tick, tf);
    const candleBuffer = inst.candles.get(tf)!;
    if (isNew) {
      candleBuffer.push(candle);
    } else if (candleBuffer.length > 0) {
      candleBuffer.updateLast(candle);
    } else {
      candleBuffer.push(candle);
    }
  }
}

export const useMarketStore = create<MarketState>((set, get) => ({
  instruments: {},
  tickCount: 0,
  candleAggregator: new CandleAggregator(),

  initInstrument: (symbol: string) => {
    set((state) => {
      if (state.instruments[symbol]) return state;
      return {
        instruments: {
          ...state.instruments,
          [symbol]: createInstrumentState(),
        },
      };
    });
  },

  processTick: (tick: Tick) => {
    const state = get();
    let inst = state.instruments[tick.symbol];
    if (!inst) {
      inst = createInstrumentState();
    }

    applyTickToInstrument(inst, tick, state.candleAggregator);

    set({
      instruments: {
        ...state.instruments,
        [tick.symbol]: { ...inst },
      },
      tickCount: state.tickCount + 1,
    });
  },

  // Batch process ticks with a single state update at the end.
  // Used during warmup to avoid thousands of individual re-renders.
  processBatch: (ticks: Tick[]) => {
    const state = get();
    const instruments = { ...state.instruments };

    for (const tick of ticks) {
      let inst = instruments[tick.symbol];
      if (!inst) {
        inst = createInstrumentState();
        instruments[tick.symbol] = inst;
      }
      applyTickToInstrument(inst, tick, state.candleAggregator);
    }

    // Spread each instrument to trigger Zustand equality check
    for (const sym of Object.keys(instruments)) {
      instruments[sym] = { ...instruments[sym] };
    }

    set({
      instruments,
      tickCount: state.tickCount + ticks.length,
    });
  },

  updateOrderBook: (symbol: string, book: OrderBook) => {
    set((state) => {
      const inst = state.instruments[symbol];
      if (!inst) return state;
      return {
        instruments: {
          ...state.instruments,
          [symbol]: { ...inst, orderBook: book },
        },
      };
    });
  },

  reset: () => {
    set({
      instruments: {},
      tickCount: 0,
      candleAggregator: new CandleAggregator(),
    });
  },
}));
