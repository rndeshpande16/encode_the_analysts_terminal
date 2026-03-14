import { useRef, useEffect, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type AreaData,
  type HistogramData,
  type Time,
  type MouseEventParams,
} from "lightweight-charts";
import type { TimeFrame } from "../engine/types.ts";
import { TIMEFRAME_MS } from "../engine/types.ts";
import { useMarketStore } from "../stores/market-store.ts";
import { isApiTimeframe, fetchHistoricalData } from "../lib/yahoo-finance.ts";

const DAY_MS = TIMEFRAME_MS["1D"];

function isLineMode(tf: TimeFrame): boolean {
  return TIMEFRAME_MS[tf] >= DAY_MS;
}

/**
 * Returns the number of most-recent bars to show for intraday timeframes.
 * For daily+ (API data), returns 0 → fitContent.
 */
function getVisibleBars(tf: TimeFrame): number {
  switch (tf) {
    case "1m":  return 60;   // ~1 hour
    case "5m":  return 48;   // ~4 hours
    case "15m": return 32;   // ~8 hours
    case "1h":  return 24;   // ~1 day
    case "4h":  return 30;   // ~5 days
    default:    return 0;    // fitContent
  }
}

export function useLightweightChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  symbol: string,
  timeFrame: TimeFrame,
) {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Create chart on mount / when symbol or timeframe changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lineMode = isLineMode(timeFrame);
    let cancelled = false;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "#0a0e17" },
        textColor: "#94a3b8",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        timeVisible: !lineMode,
        secondsVisible: !lineMode,
        borderColor: "#1e293b",
        minBarSpacing: 0.5,
      },
      rightPriceScale: { borderColor: "#1e293b" },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      kineticScroll: {
        mouse: true,
        touch: true,
      },
    });

    let candleSeries: ISeriesApi<"Candlestick"> | null = null;
    let areaSeries: ISeriesApi<"Area"> | null = null;

    if (lineMode) {
      areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "#3b82f6",
        topColor: "rgba(59, 130, 246, 0.25)",
        bottomColor: "rgba(59, 130, 246, 0.02)",
        lineWidth: 2,
      });
    } else {
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    areaSeriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;

    // Load data — either from API (for daily+ TFs) or from the local store
    async function loadData() {
      /** Show either the last N bars or fitContent based on timeframe */
      function applyVisibleRange(dataLength: number) {
        const bars = getVisibleBars(timeFrame);
        if (bars > 0 && dataLength > bars) {
          chart.timeScale().setVisibleLogicalRange({
            from: dataLength - bars,
            to: dataLength - 1,
          });
        } else {
          chart.timeScale().fitContent();
        }
      }

      if (isApiTimeframe(timeFrame)) {
        // Fetch real historical data from Yahoo Finance
        const apiCandles = await fetchHistoricalData(symbol, timeFrame);
        if (cancelled) return;

        if (apiCandles && apiCandles.length > 0) {
          if (lineMode && areaSeries) {
            const lineData = apiCandles.map((c) => ({
              time: c.time as Time,
              value: c.close,
            })) as AreaData<Time>[];
            areaSeries.setData(lineData);
          }

          const volData = apiCandles.map((c) => ({
            time: c.time as Time,
            value: c.volume,
            color:
              c.close >= c.open
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(239, 68, 68, 0.3)",
          })) as HistogramData<Time>[];
          volumeSeries.setData(volData);
          applyVisibleRange(apiCandles.length);
          return;
        }
        // If API fails, fall through to local store data
      }

      // Load from local candle store (for intraday TFs or API fallback)
      const inst = useMarketStore.getState().instruments[symbol];
      if (!inst) return;
      const candleBuffer = inst.candles.get(timeFrame);
      if (!candleBuffer || candleBuffer.length === 0) return;

      const candles = candleBuffer.toArray();

      // Deduplicate by time (keep latest) and sort ascending — required by lightweight-charts
      const byTime = new Map<number, (typeof candles)[0]>();
      for (const c of candles) {
        byTime.set(c.time, c);
      }
      const sorted = Array.from(byTime.values()).sort(
        (a, b) => a.time - b.time,
      );

      if (lineMode && areaSeries) {
        const lineData = sorted.map((c) => ({
          time: c.time as Time,
          value: c.close,
        })) as AreaData<Time>[];
        areaSeries.setData(lineData);
      } else if (candleSeries) {
        candleSeries.setData(
          sorted as unknown as CandlestickData<Time>[],
        );
      }

      const volData = sorted.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color:
          c.close >= c.open
            ? "rgba(34, 197, 94, 0.3)"
            : "rgba(239, 68, 68, 0.3)",
      })) as HistogramData<Time>[];
      volumeSeries.setData(volData);
      applyVisibleRange(sorted.length);
    }

    loadData();

    // Crosshair tooltip
    const tooltip = document.createElement("div");
    tooltip.style.cssText = `
      position: absolute;
      display: none;
      z-index: 20;
      pointer-events: none;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11px;
      color: #e2e8f0;
      white-space: nowrap;
      font-family: ui-monospace, monospace;
    `;
    container.style.position = "relative";
    container.appendChild(tooltip);

    chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.display = "none";
        return;
      }

      let html = "";
      const timeStr = typeof param.time === "number"
        ? new Date(param.time * 1000).toLocaleDateString()
        : String(param.time);

      if (lineMode && areaSeries) {
        const data = param.seriesData.get(areaSeries) as AreaData<Time> | undefined;
        if (data && "value" in data) {
          html = `<div style="color:#94a3b8;font-size:9px">${timeStr}</div>
                  <div style="color:#3b82f6;font-weight:600">${data.value.toFixed(2)}</div>`;
        }
      } else if (candleSeries) {
        const data = param.seriesData.get(candleSeries) as CandlestickData<Time> | undefined;
        if (data && "open" in data) {
          const isUp = data.close >= data.open;
          const color = isUp ? "#22c55e" : "#ef4444";
          html = `<div style="color:#94a3b8;font-size:9px">${timeStr}</div>
                  <div>O: <span style="color:${color}">${data.open.toFixed(2)}</span></div>
                  <div>H: <span style="color:${color}">${data.high.toFixed(2)}</span></div>
                  <div>L: <span style="color:${color}">${data.low.toFixed(2)}</span></div>
                  <div>C: <span style="color:${color};font-weight:600">${data.close.toFixed(2)}</span></div>`;
        }
      }

      if (!html) {
        tooltip.style.display = "none";
        return;
      }

      tooltip.innerHTML = html;
      tooltip.style.display = "block";

      const tooltipWidth = tooltip.offsetWidth;
      const containerWidth = container.clientWidth;
      let left = param.point.x + 16;
      if (left + tooltipWidth > containerWidth) {
        left = param.point.x - tooltipWidth - 16;
      }
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${Math.max(0, param.point.y - 10)}px`;
    });

    // ResizeObserver for responsive sizing
    const observer = new ResizeObserver(() => {
      if (container) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      tooltip.remove();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      areaSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [symbol, timeFrame, containerRef]);

  // Subscribe to store for incremental updates (NON-React path)
  // Only for intraday timeframes — API timeframes show static historical data
  useEffect(() => {
    if (isApiTimeframe(timeFrame)) return;

    let lastCandleTime = 0;
    const lineMode = isLineMode(timeFrame);

    const unsub = useMarketStore.subscribe((state) => {
      const inst = state.instruments[symbol];
      if (!inst) return;

      const candleBuffer = inst.candles.get(timeFrame);
      if (!candleBuffer || candleBuffer.length === 0) return;

      const lastCandle = candleBuffer.last();
      if (!lastCandle) return;

      const volumeSeries = volumeSeriesRef.current;
      if (!volumeSeries) return;

      if (lineMode) {
        const areaSeries = areaSeriesRef.current;
        if (!areaSeries) return;
        areaSeries.update({
          time: lastCandle.time as Time,
          value: lastCandle.close,
        } as AreaData<Time>);
      } else {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;
        candleSeries.update(lastCandle as unknown as CandlestickData<Time>);
      }

      // Update volume
      volumeSeries.update({
        time: lastCandle.time as Time,
        value: lastCandle.volume,
        color:
          lastCandle.close >= lastCandle.open
            ? "rgba(34, 197, 94, 0.3)"
            : "rgba(239, 68, 68, 0.3)",
      } as HistogramData<Time>);

      // Auto-scroll on new candles
      if (lastCandle.time !== lastCandleTime) {
        lastCandleTime = lastCandle.time;
        chartRef.current?.timeScale().scrollToRealTime();
      }
    });

    return unsub;
  }, [symbol, timeFrame]);

  const fitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  return { chartRef, candleSeriesRef, areaSeriesRef, volumeSeriesRef, fitContent };
}
