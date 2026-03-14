import { useEffect, useRef, useState, useCallback } from "react";
import { MarketEngine } from "./engine/market-engine.ts";
import {
  activeInstruments,
  setActiveMarket,
  getDefaultSymbol,
  DEFAULT_TICK_RATE,
} from "./engine/constants.ts";
import { useMarketStore } from "./stores/market-store.ts";
import { useAnomalyStore } from "./stores/anomaly-store.ts";
import { useSelectionStore } from "./stores/selection-store.ts";
import { useWatchlistStore } from "./stores/watchlist-store.ts";
import { useThemeStore, applyTheme } from "./stores/theme-store.ts";
import { Terminal } from "./components/layout/Terminal.tsx";
import type { MarketMode } from "./engine/types.ts";

export default function App() {
  const engineRef = useRef<MarketEngine | null>(null);
  const [engineStatus, setEngineStatus] = useState<
    "running" | "paused" | "stopped"
  >("stopped");
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const marketMode = useSelectionStore((s) => s.marketMode);

  // Apply persisted theme on mount
  useEffect(() => {
    applyTheme(useThemeStore.getState().themeId);
  }, []);

  // Boot / reboot the engine whenever marketMode changes
  useEffect(() => {
    // Stop any previous engine
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setLoading(true);

    // Flush old state
    useMarketStore.getState().reset();
    useAnomalyStore.getState().clear();

    // Update the global cached market data
    setActiveMarket(marketMode);

    const instruments = activeInstruments();

    // Initialize instruments in store
    for (const inst of instruments) {
      useMarketStore.getState().initInstrument(inst.symbol);
    }

    const engine = new MarketEngine({
      instruments,
      tickRate: DEFAULT_TICK_RATE,
      onTick: (tick) => useMarketStore.getState().processTick(tick),
      onBatch: (ticks) => useMarketStore.getState().processBatch(ticks),
      onOrderBook: (symbol, book) =>
        useMarketStore.getState().updateOrderBook(symbol, book),
      onAnomaly: (anomaly) => useAnomalyStore.getState().addAnomaly(anomaly),
    });

    engine.generateWarmup(2000, 300_000);

    const warmupCount = useMarketStore.getState().tickCount;

    engineRef.current = engine;
    engine.setSpeed(speed);
    engine.start();
    setEngineStatus("running");

    const unsub = useMarketStore.subscribe((state) => {
      if (state.tickCount <= warmupCount) return;
      const hasOrderBook = Object.values(state.instruments).some(
        (inst) => inst.orderBook.bids.length > 0,
      );
      if (!hasOrderBook) return;
      requestAnimationFrame(() => setLoading(false));
      unsub();
    });

    return () => {
      unsub();
      engine.stop();
      engineRef.current = null;
    };
  }, [marketMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isRunning) {
      engine.pause();
      setEngineStatus("paused");
    } else {
      engine.resume();
      setEngineStatus("running");
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    engineRef.current?.setSpeed(newSpeed);
    setSpeed(newSpeed);
  };

  const handleMarketSwitch = useCallback(
    (mode: MarketMode) => {
      if (mode === marketMode) return;
      useSelectionStore.getState().setMarketMode(mode);
      useSelectionStore.getState().setActiveInstrument(getDefaultSymbol(mode));
      useSelectionStore.getState().setActiveTimeFrame("1m");
      useWatchlistStore.getState().resetToMarket(mode);
    },
    [marketMode],
  );

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--color-terminal-bg)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />
          <h1 className="text-lg font-semibold tracking-widest text-slate-300 uppercase">
            Encode Terminal
          </h1>
        </div>
        <div className="mb-4 flex gap-1">
          <div
            className="h-1 w-8 rounded-full bg-blue-500/60"
            style={{ animation: "loading-bar 1.2s ease-in-out infinite" }}
          />
          <div
            className="h-1 w-8 rounded-full bg-blue-500/40"
            style={{
              animation: "loading-bar 1.2s ease-in-out 0.2s infinite",
            }}
          />
          <div
            className="h-1 w-8 rounded-full bg-blue-500/20"
            style={{
              animation: "loading-bar 1.2s ease-in-out 0.4s infinite",
            }}
          />
        </div>
        <p className="text-xs text-slate-500">
          Loading {marketMode === "US" ? "US" : "Indian"} market data...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[var(--color-terminal-bg)] text-slate-200">
      <Terminal
        engineStatus={engineStatus}
        speed={speed}
        onToggle={handleToggle}
        onSpeedChange={handleSpeedChange}
        marketMode={marketMode}
        onMarketSwitch={handleMarketSwitch}
      />
    </div>
  );
}
