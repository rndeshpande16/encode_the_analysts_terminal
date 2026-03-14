import { useAnomalyStore } from "../stores/anomaly-store.ts";
import type { AnomalyType } from "../engine/types.ts";

const GLOW_CLASSES: Record<AnomalyType, string> = {
  price_spike: "animate-glow-amber",
  volume_burst: "animate-glow-blue",
  correlation_break: "animate-glow-purple",
  momentum_shift: "animate-glow-amber",
};

export function useAnomalyPulse(symbol?: string): {
  isActive: boolean;
  glowClass: string;
  anomalyType: AnomalyType | null;
} {
  const activeWhispers = useAnomalyStore((s) => s.activeWhispers);

  const matching = symbol
    ? activeWhispers.find((w) => w.symbol === symbol)
    : (activeWhispers[0] ?? null);

  if (!matching) {
    return { isActive: false, glowClass: "", anomalyType: null };
  }

  return {
    isActive: true,
    glowClass: GLOW_CLASSES[matching.type],
    anomalyType: matching.type,
  };
}
