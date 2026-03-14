import { useEffect, useState } from "react";
import { useMarketStore } from "../../stores/market-store.ts";
import { activeInstruments } from "../../engine/constants.ts";
import { heatmapColor } from "../../lib/color.ts";

interface HeatCell {
  symbol: string;
  name: string;
  changePercent: number;
}

function getHeatData(): HeatCell[] {
  const state = useMarketStore.getState();
  return activeInstruments().map((inst) => {
    const is = state.instruments[inst.symbol];
    const price = is?.lastTick?.price ?? inst.basePrice;
    const changePercent = ((price - inst.basePrice) / inst.basePrice) * 100;
    return { symbol: inst.symbol, name: inst.name, changePercent };
  });
}

export function HeatmapPanel() {
  const [cells, setCells] = useState<HeatCell[]>(getHeatData);

  useEffect(() => {
    // Compute initial data immediately (warmup data already available)
    setCells(getHeatData());

    // Refresh every 30 seconds
    const interval = setInterval(() => setCells(getHeatData()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="grid grid-cols-3 gap-1">
        {cells.map((cell) => (
          <div
            key={cell.symbol}
            className="flex flex-col items-center justify-center rounded py-2 transition-colors duration-1000"
            style={{ backgroundColor: heatmapColor(cell.changePercent) }}
          >
            <span className="text-[10px] font-bold text-white/90">
              {cell.symbol}
            </span>
            <span className="text-[9px] text-white/70 tabular-nums">
              {cell.changePercent >= 0 ? "+" : ""}
              {cell.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
