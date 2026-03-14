import { create } from "zustand";
import type { TimeFrame, MarketMode } from "../engine/types.ts";

interface SelectionState {
  marketMode: MarketMode;
  activeInstrument: string;
  activeTimeFrame: TimeFrame;
  setMarketMode: (mode: MarketMode) => void;
  setActiveInstrument: (symbol: string) => void;
  setActiveTimeFrame: (tf: TimeFrame) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  marketMode: "US",
  activeInstrument: "AAPL",
  activeTimeFrame: "1m",
  setMarketMode: (mode) => set({ marketMode: mode }),
  setActiveInstrument: (symbol) => set({ activeInstrument: symbol }),
  setActiveTimeFrame: (tf) => set({ activeTimeFrame: tf }),
}));
