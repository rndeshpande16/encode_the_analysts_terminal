import { create } from "zustand";
import { persist } from "zustand/middleware";
import { activeInstruments } from "../engine/constants.ts";
import { getInstruments } from "../engine/markets/index.ts";
import type { MarketMode } from "../engine/types.ts";

interface WatchlistState {
  symbols: string[];
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  resetToMarket: (mode: MarketMode) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      symbols: activeInstruments().map((i) => i.symbol),

      addSymbol: (symbol: string) =>
        set((state) => {
          if (state.symbols.includes(symbol)) return state;
          return { symbols: [...state.symbols, symbol] };
        }),

      removeSymbol: (symbol: string) =>
        set((state) => ({
          symbols: state.symbols.filter((s) => s !== symbol),
        })),

      resetToMarket: (mode: MarketMode) =>
        set({ symbols: getInstruments(mode).map((i) => i.symbol) }),
    }),
    { name: "encode-watchlist-v2" },
  ),
);
