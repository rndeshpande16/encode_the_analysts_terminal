import { useEffect, useState } from "react";
import clsx from "clsx";
import { useSelectionStore } from "../../stores/selection-store.ts";
import { useMarketStore } from "../../stores/market-store.ts";
import { activeInstruments, activeFundamentals } from "../../engine/constants.ts";
import { formatPrice } from "../../lib/format.ts";

export function FundamentalsPanel() {
  const symbol = useSelectionStore((s) => s.activeInstrument);
  const fund = activeFundamentals()[symbol];
  const instrument = activeInstruments().find((i) => i.symbol === symbol);
  const [price, setPrice] = useState(instrument?.basePrice ?? 0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useMarketStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const inst = useMarketStore.getState().instruments[symbol];
        if (inst?.lastTick) setPrice(inst.lastTick.price);
      }, 500);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [symbol]);

  if (!fund) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-600">
        No fundamental data
      </div>
    );
  }

  const isForex = fund.sector === "Forex";
  const isCrypto = fund.sector === "Crypto";

  // 52-week range position
  const rangePos =
    fund.fiftyTwoWeekHigh !== fund.fiftyTwoWeekLow
      ? ((price - fund.fiftyTwoWeekLow) /
          (fund.fiftyTwoWeekHigh - fund.fiftyTwoWeekLow)) *
        100
      : 50;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 text-[11px]">
      {/* Header */}
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-200">{symbol}</span>
          <span className="ml-2 text-[10px] text-slate-500">
            {instrument?.name}
          </span>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-medium"
          style={{
            backgroundColor:
              fund.sector === "Technology"
                ? "rgba(59,130,246,0.15)"
                : fund.sector === "Automotive"
                  ? "rgba(168,85,247,0.15)"
                  : fund.sector === "Commodities"
                    ? "rgba(234,179,8,0.15)"
                    : fund.sector === "Crypto"
                      ? "rgba(249,115,22,0.15)"
                      : "rgba(100,116,139,0.15)",
            color:
              fund.sector === "Technology"
                ? "#60a5fa"
                : fund.sector === "Automotive"
                  ? "#a78bfa"
                  : fund.sector === "Commodities"
                    ? "#facc15"
                    : fund.sector === "Crypto"
                      ? "#fb923c"
                      : "#94a3b8",
          }}
        >
          {fund.sector}
        </span>
      </div>

      {/* 52-Week Range Bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-[9px] text-slate-500">
          <span>
            52W Low:{" "}
            {formatPrice(fund.fiftyTwoWeekLow, instrument?.tickSize ?? 0.01)}
          </span>
          <span>
            52W High:{" "}
            {formatPrice(fund.fiftyTwoWeekHigh, instrument?.tickSize ?? 0.01)}
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.max(2, Math.min(98, rangePos))}%`,
              background: `linear-gradient(90deg, #ef4444, #eab308, #22c55e)`,
            }}
          />
          <div
            className="absolute top-0 h-2 w-0.5 bg-white"
            style={{ left: `${Math.max(1, Math.min(99, rangePos))}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {!isForex && fund.marketCap !== "N/A" && (
          <FundRow label="Market Cap" value={fund.marketCap} />
        )}
        {!isForex && !isCrypto && fund.peRatio > 0 && (
          <FundRow
            label="P/E Ratio"
            value={fund.peRatio.toFixed(1)}
            highlight={
              fund.peRatio > 40 ? "high" : fund.peRatio < 15 ? "low" : undefined
            }
          />
        )}
        {!isForex && !isCrypto && fund.eps > 0 && (
          <FundRow label="EPS" value={`$${fund.eps.toFixed(2)}`} />
        )}
        {!isForex && !isCrypto && fund.pegRatio > 0 && (
          <FundRow
            label="PEG Ratio"
            value={fund.pegRatio.toFixed(2)}
            highlight={
              fund.pegRatio > 2.5 ? "high" : fund.pegRatio < 1 ? "good" : undefined
            }
          />
        )}
        {fund.dividendYield > 0 && (
          <FundRow
            label="Div Yield"
            value={`${fund.dividendYield.toFixed(2)}%`}
            highlight={fund.dividendYield > 2 ? "good" : undefined}
          />
        )}
        {!isForex && fund.revenue !== "N/A" && (
          <FundRow label="Revenue" value={fund.revenue} />
        )}
        {fund.profitMargin > 0 && (
          <FundRow
            label="Profit Margin"
            value={`${fund.profitMargin.toFixed(1)}%`}
            highlight={
              fund.profitMargin > 25
                ? "good"
                : fund.profitMargin < 10
                  ? "warn"
                  : undefined
            }
          />
        )}
        {fund.debtToEquity > 0 && (
          <FundRow
            label="Debt/Equity"
            value={fund.debtToEquity.toFixed(2)}
            highlight={fund.debtToEquity > 2 ? "warn" : undefined}
          />
        )}
        {fund.roe > 0 && (
          <FundRow
            label="ROE"
            value={`${fund.roe.toFixed(1)}%`}
            highlight={fund.roe > 20 ? "good" : undefined}
          />
        )}
        {fund.beta > 0 && (
          <FundRow
            label="Beta"
            value={fund.beta.toFixed(2)}
            highlight={
              fund.beta > 1.5 ? "high" : fund.beta < 0.5 ? "low" : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

function FundRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "good" | "warn" | "high" | "low";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={clsx(
          "tabular-nums font-medium",
          highlight === "good" && "text-green-400",
          highlight === "warn" && "text-amber-400",
          highlight === "high" && "text-red-400",
          highlight === "low" && "text-blue-400",
          !highlight && "text-slate-300",
        )}
      >
        {value}
      </span>
    </div>
  );
}
