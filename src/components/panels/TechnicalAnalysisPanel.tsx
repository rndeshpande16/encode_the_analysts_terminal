import { useEffect, useState } from "react";
import clsx from "clsx";
import { useMarketStore } from "../../stores/market-store.ts";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { analyzeTechnicals } from "../../engine/technical-analysis.ts";
import { activeFundamentals } from "../../engine/constants.ts";
import type { AnalysisResult, Tick } from "../../engine/types.ts";

const VERDICT_CONFIG = {
  strong_buy: {
    label: "STRONG BUY",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
  },
  buy: { label: "BUY", color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  neutral: { label: "NEUTRAL", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  sell: { label: "SELL", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  strong_sell: {
    label: "STRONG SELL",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
  },
};

export function TechnicalAnalysisPanel() {
  const symbol = useSelectionStore((s) => s.activeInstrument);
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    overall: "neutral",
    score: 0,
    signals: [],
    summary: "Collecting data...",
  });

  useEffect(() => {
    // Compute initial analysis immediately from warmup data
    const instInitial = useMarketStore.getState().instruments[symbol];
    if (instInitial) {
      const ticks = instInitial.tickHistory.toArray();
      const prices = ticks.map((t: Tick) => t.price);
      const volumes = ticks.map((t: Tick) => t.volume);
      if (prices.length > 10) {
        setAnalysis(analyzeTechnicals(prices, volumes));
      }
    }

    let timer: ReturnType<typeof setTimeout>;
    const unsub = useMarketStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const inst = useMarketStore.getState().instruments[symbol];
        if (!inst) return;
        const ticks = inst.tickHistory.toArray();
        const prices = ticks.map((t: Tick) => t.price);
        const volumes = ticks.map((t: Tick) => t.volume);
        if (prices.length > 10) {
          setAnalysis(analyzeTechnicals(prices, volumes));
        }
      }, 1000);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [symbol]);

  const verdict = VERDICT_CONFIG[analysis.overall];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-[11px]">
      {/* Verdict Badge */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className="rounded-lg px-3 py-1.5 text-center"
          style={{ backgroundColor: verdict.bg }}
        >
          <div className="text-[9px] text-slate-500 uppercase">Signal</div>
          <div className="text-sm font-bold" style={{ color: verdict.color }}>
            {verdict.label}
          </div>
        </div>

        {/* Score Gauge */}
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-[9px] text-slate-500">
            <span>Sell</span>
            <span>Score: {analysis.score}</span>
            <span>Buy</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #ef4444, #eab308 50%, #22c55e)",
                opacity: 0.3,
              }}
            />
            <div
              className="absolute top-0 h-2.5 w-1 rounded-full bg-white shadow-md transition-all duration-700"
              style={{ left: `${((analysis.score + 100) / 200) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analyst Consensus */}
      {(() => {
        const fund = activeFundamentals()[symbol];
        if (!fund) return null;
        return (
          <div className="mb-3">
            <div className="mb-1 text-[9px] font-semibold uppercase text-slate-500">
              Analyst Consensus
            </div>
            <div className="mb-1 flex justify-between text-[9px]">
              <span style={{ color: "#22c55e" }}>Buy {fund.analystBuy}%</span>
              <span className="text-slate-400">Hold {fund.analystHold}%</span>
              <span style={{ color: "#ef4444" }}>Sell {fund.analystSell}%</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full">
              <div
                style={{
                  width: `${fund.analystBuy}%`,
                  backgroundColor: "#22c55e",
                }}
              />
              <div
                style={{
                  width: `${fund.analystHold}%`,
                  backgroundColor: "#64748b",
                }}
              />
              <div
                style={{
                  width: `${fund.analystSell}%`,
                  backgroundColor: "#ef4444",
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Summary */}
      <div className="mb-2 text-[10px] text-slate-400">{analysis.summary}</div>

      {/* Signal List */}
      <div className="flex flex-col gap-1">
        {analysis.signals.map((sig) => (
          <div
            key={sig.indicator}
            className="flex items-center justify-between rounded border border-slate-700/50 bg-slate-800/30 px-2 py-1"
          >
            <span className="text-slate-400">{sig.indicator}</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 tabular-nums">
                {sig.value.toFixed(2)}
              </span>
              <span
                className={clsx(
                  "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                  sig.signal === "buy" && "bg-green-500/15 text-green-400",
                  sig.signal === "sell" && "bg-red-500/15 text-red-400",
                  sig.signal === "neutral" && "bg-slate-500/15 text-slate-400",
                )}
              >
                {sig.signal}
              </span>
              {/* Strength bar */}
              <div className="h-1 w-8 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sig.strength * 100}%`,
                    backgroundColor:
                      sig.signal === "buy"
                        ? "#22c55e"
                        : sig.signal === "sell"
                          ? "#ef4444"
                          : "#64748b",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
