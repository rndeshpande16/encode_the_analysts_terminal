import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutItem, ResponsiveLayouts } from "react-grid-layout";

interface LayoutState {
  layouts: ResponsiveLayouts;
  updateLayouts: (layouts: ResponsiveLayouts) => void;
  resetLayout: () => void;
}

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "price-chart",      x: 0, y: 0,  w: 8, h: 8, minW: 4, minH: 4 },
  { i: "watchlist",         x: 8, y: 0,  w: 4, h: 8, minW: 3, minH: 4 },
  { i: "order-book",        x: 0, y: 8,  w: 3, h: 7, minW: 3, minH: 4 },
  { i: "tech-analysis",     x: 3, y: 8,  w: 3, h: 7, minW: 3, minH: 4 },
  { i: "signal-feed",       x: 6, y: 8,  w: 3, h: 7, minW: 3, minH: 3 },
  { i: "fundamentals",      x: 9, y: 8,  w: 3, h: 4, minW: 3, minH: 3 },
  { i: "statistics",         x: 9, y: 12, w: 3, h: 3, minW: 3, minH: 2 },
  { i: "analyst-forecast",  x: 0, y: 15, w: 6, h: 5, minW: 3, minH: 3 },
  { i: "heatmap",           x: 6, y: 15, w: 6, h: 5, minW: 3, minH: 2 },
];

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: DEFAULT_LAYOUT,
  md: DEFAULT_LAYOUT.map((l) => ({
    ...l,
    w: Math.min(l.w, 6),
    x: l.x > 6 ? 0 : l.x,
  })),
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layouts: DEFAULT_LAYOUTS,
      updateLayouts: (layouts) => set({ layouts }),
      resetLayout: () => set({ layouts: DEFAULT_LAYOUTS }),
    }),
    {
      name: "encode-terminal-layout-v4",
    },
  ),
);
