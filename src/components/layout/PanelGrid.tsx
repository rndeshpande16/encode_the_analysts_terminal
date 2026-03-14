import { useMemo, useCallback } from "react";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { useLayoutStore } from "../../stores/layout-store.ts";
import { Panel } from "./Panel.tsx";
import { PriceChartPanel } from "../panels/PriceChartPanel.tsx";
import { WatchlistPanel } from "../panels/WatchlistPanel.tsx";
import { OrderBookPanel } from "../panels/OrderBookPanel.tsx";
import { SignalFeedPanel } from "../panels/SignalFeedPanel.tsx";
import { StatisticsPanel } from "../panels/StatisticsPanel.tsx";
import { HeatmapPanel } from "../panels/HeatmapPanel.tsx";
import { FundamentalsPanel } from "../panels/FundamentalsPanel.tsx";
import { TechnicalAnalysisPanel } from "../panels/TechnicalAnalysisPanel.tsx";
import { AnalystForecastPanel } from "../panels/AnalystForecastPanel.tsx";
import "react-grid-layout/css/styles.css";

const PANELS = [
  { id: "price-chart",   title: "Price Chart",          Component: PriceChartPanel },
  { id: "watchlist",      title: "Watchlist",             Component: WatchlistPanel },
  { id: "order-book",     title: "Order Book",            Component: OrderBookPanel },
  { id: "tech-analysis",  title: "Technical Analysis",    Component: TechnicalAnalysisPanel },
  { id: "signal-feed",    title: "Signals",               Component: SignalFeedPanel },
  { id: "fundamentals",   title: "Fundamentals",          Component: FundamentalsPanel },
  { id: "statistics",     title: "Statistics",             Component: StatisticsPanel },
  { id: "analyst-forecast", title: "Analyst Forecast",    Component: AnalystForecastPanel },
  { id: "heatmap",        title: "Heatmap",               Component: HeatmapPanel },
];

export function PanelGrid() {
  const layouts = useLayoutStore((s) => s.layouts);
  const updateLayouts = useLayoutStore((s) => s.updateLayouts);
  const { width, containerRef } = useContainerWidth({ initialWidth: 1280 });

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts) => {
      updateLayouts(allLayouts);
    },
    [updateLayouts],
  );

  const panelElements = useMemo(
    () =>
      PANELS.map(({ id, title, Component }) => (
        <div key={id}>
          <Panel title={title} panelId={id}>
            <Component />
          </Panel>
        </div>
      )),
    [],
  );

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {width > 0 && (
        <ResponsiveGridLayout
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 768 }}
          cols={{ lg: 12, md: 6 }}
          rowHeight={40}
          margin={[6, 6] as const}
          containerPadding={[6, 6] as const}
          onLayoutChange={handleLayoutChange}
          dragConfig={{ handle: ".panel-drag-handle" }}
        >
          {panelElements}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
