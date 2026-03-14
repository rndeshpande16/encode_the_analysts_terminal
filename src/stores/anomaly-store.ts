import { create } from "zustand";
import type { Anomaly } from "../engine/types.ts";
import { ANOMALY_HISTORY_CAPACITY } from "../engine/constants.ts";

interface AnomalyState {
  anomalies: Anomaly[];
  activeWhispers: Anomaly[];
  whisperDuration: number;

  addAnomaly: (anomaly: Anomaly) => void;
  dismissWhisper: (id: string) => void;
  clear: () => void;
}

export const useAnomalyStore = create<AnomalyState>((set, get) => ({
  anomalies: [],
  activeWhispers: [],
  whisperDuration: 5000,

  addAnomaly: (anomaly: Anomaly) => {
    set((state) => ({
      anomalies: [anomaly, ...state.anomalies].slice(
        0,
        ANOMALY_HISTORY_CAPACITY,
      ),
      activeWhispers: [anomaly, ...state.activeWhispers].slice(0, 3),
    }));

    // Auto-dismiss after duration
    const duration = get().whisperDuration;
    setTimeout(() => {
      get().dismissWhisper(anomaly.id);
    }, duration);
  },

  dismissWhisper: (id: string) => {
    set((state) => ({
      activeWhispers: state.activeWhispers.filter((w) => w.id !== id),
    }));
  },

  clear: () => {
    set({ anomalies: [], activeWhispers: [] });
  },
}));
