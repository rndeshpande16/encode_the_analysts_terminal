import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ThemeColors {
  "--color-terminal-bg": string;
  "--color-terminal-surface": string;
  "--color-terminal-panel": string;
  "--color-terminal-border": string;
  "--color-positive": string;
  "--color-negative": string;
  "--color-neutral": string;
  "--color-anomaly": string;
  "--color-anomaly-glow": string;
  "--color-text-primary": string;
  "--color-text-secondary": string;
  "--color-text-muted": string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      "--color-terminal-bg": "#0a0e17",
      "--color-terminal-surface": "#111827",
      "--color-terminal-panel": "#1a2332",
      "--color-terminal-border": "#1e293b",
      "--color-positive": "#22c55e",
      "--color-negative": "#ef4444",
      "--color-neutral": "#3b82f6",
      "--color-anomaly": "#f59e0b",
      "--color-anomaly-glow": "rgba(245, 158, 11, 0.15)",
      "--color-text-primary": "#e2e8f0",
      "--color-text-secondary": "#94a3b8",
      "--color-text-muted": "#475569",
    },
  },
  {
    id: "arctic",
    name: "Arctic Light",
    colors: {
      "--color-terminal-bg": "#f8fafc",
      "--color-terminal-surface": "#f1f5f9",
      "--color-terminal-panel": "#ffffff",
      "--color-terminal-border": "#cbd5e1",
      "--color-positive": "#16a34a",
      "--color-negative": "#dc2626",
      "--color-neutral": "#2563eb",
      "--color-anomaly": "#d97706",
      "--color-anomaly-glow": "rgba(217, 119, 6, 0.12)",
      "--color-text-primary": "#1e293b",
      "--color-text-secondary": "#475569",
      "--color-text-muted": "#94a3b8",
    },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    colors: {
      "--color-terminal-bg": "#09090b",
      "--color-terminal-surface": "#18181b",
      "--color-terminal-panel": "#1c1c20",
      "--color-terminal-border": "#27272a",
      "--color-positive": "#4ade80",
      "--color-negative": "#f87171",
      "--color-neutral": "#60a5fa",
      "--color-anomaly": "#fbbf24",
      "--color-anomaly-glow": "rgba(251, 191, 36, 0.12)",
      "--color-text-primary": "#fafafa",
      "--color-text-secondary": "#a1a1aa",
      "--color-text-muted": "#52525b",
    },
  },
  {
    id: "warm-amber",
    name: "Warm Amber",
    colors: {
      "--color-terminal-bg": "#1a1208",
      "--color-terminal-surface": "#221a0e",
      "--color-terminal-panel": "#2a2014",
      "--color-terminal-border": "#3d2e1a",
      "--color-positive": "#84cc16",
      "--color-negative": "#ef4444",
      "--color-neutral": "#f59e0b",
      "--color-anomaly": "#fb923c",
      "--color-anomaly-glow": "rgba(251, 146, 60, 0.15)",
      "--color-text-primary": "#fef3c7",
      "--color-text-secondary": "#d4a574",
      "--color-text-muted": "#8b6914",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    colors: {
      "--color-terminal-bg": "#0a1628",
      "--color-terminal-surface": "#0f1d32",
      "--color-terminal-panel": "#15253e",
      "--color-terminal-border": "#1e3a5f",
      "--color-positive": "#34d399",
      "--color-negative": "#fb7185",
      "--color-neutral": "#38bdf8",
      "--color-anomaly": "#e879f9",
      "--color-anomaly-glow": "rgba(232, 121, 249, 0.15)",
      "--color-text-primary": "#e0f2fe",
      "--color-text-secondary": "#7dd3fc",
      "--color-text-muted": "#3b6fa0",
    },
  },
  {
    id: "emerald-forest",
    name: "Emerald Forest",
    colors: {
      "--color-terminal-bg": "#071a12",
      "--color-terminal-surface": "#0c2418",
      "--color-terminal-panel": "#122d1f",
      "--color-terminal-border": "#1a4030",
      "--color-positive": "#4ade80",
      "--color-negative": "#fca5a5",
      "--color-neutral": "#2dd4bf",
      "--color-anomaly": "#facc15",
      "--color-anomaly-glow": "rgba(250, 204, 21, 0.12)",
      "--color-text-primary": "#dcfce7",
      "--color-text-secondary": "#86efac",
      "--color-text-muted": "#3d7a56",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      "--color-terminal-bg": "#1c0a15",
      "--color-terminal-surface": "#26101e",
      "--color-terminal-panel": "#301628",
      "--color-terminal-border": "#4a2040",
      "--color-positive": "#a3e635",
      "--color-negative": "#f87171",
      "--color-neutral": "#c084fc",
      "--color-anomaly": "#fb923c",
      "--color-anomaly-glow": "rgba(251, 146, 60, 0.15)",
      "--color-text-primary": "#fce7f3",
      "--color-text-secondary": "#f9a8d4",
      "--color-text-muted": "#834570",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    colors: {
      "--color-terminal-bg": "#0d0015",
      "--color-terminal-surface": "#14001f",
      "--color-terminal-panel": "#1a0a28",
      "--color-terminal-border": "#2e1050",
      "--color-positive": "#00ff88",
      "--color-negative": "#ff0055",
      "--color-neutral": "#00d4ff",
      "--color-anomaly": "#ff00ff",
      "--color-anomaly-glow": "rgba(255, 0, 255, 0.2)",
      "--color-text-primary": "#e4ccff",
      "--color-text-secondary": "#b388ff",
      "--color-text-muted": "#6e3aad",
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    colors: {
      "--color-terminal-bg": "#002b36",
      "--color-terminal-surface": "#073642",
      "--color-terminal-panel": "#0a3d49",
      "--color-terminal-border": "#164a56",
      "--color-positive": "#859900",
      "--color-negative": "#dc322f",
      "--color-neutral": "#268bd2",
      "--color-anomaly": "#b58900",
      "--color-anomaly-glow": "rgba(181, 137, 0, 0.15)",
      "--color-text-primary": "#eee8d5",
      "--color-text-secondary": "#93a1a1",
      "--color-text-muted": "#586e75",
    },
  },
  {
    id: "nord",
    name: "Nord",
    colors: {
      "--color-terminal-bg": "#2e3440",
      "--color-terminal-surface": "#3b4252",
      "--color-terminal-panel": "#434c5e",
      "--color-terminal-border": "#4c566a",
      "--color-positive": "#a3be8c",
      "--color-negative": "#bf616a",
      "--color-neutral": "#81a1c1",
      "--color-anomaly": "#ebcb8b",
      "--color-anomaly-glow": "rgba(235, 203, 139, 0.15)",
      "--color-text-primary": "#eceff4",
      "--color-text-secondary": "#d8dee9",
      "--color-text-muted": "#7b88a1",
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    colors: {
      "--color-terminal-bg": "#1e1f1c",
      "--color-terminal-surface": "#272822",
      "--color-terminal-panel": "#2d2e27",
      "--color-terminal-border": "#3e3d32",
      "--color-positive": "#a6e22e",
      "--color-negative": "#f92672",
      "--color-neutral": "#66d9ef",
      "--color-anomaly": "#e6db74",
      "--color-anomaly-glow": "rgba(230, 219, 116, 0.15)",
      "--color-text-primary": "#f8f8f2",
      "--color-text-secondary": "#cfcfc2",
      "--color-text-muted": "#75715e",
    },
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    colors: {
      "--color-terminal-bg": "#000000",
      "--color-terminal-surface": "#0a0a0a",
      "--color-terminal-panel": "#111111",
      "--color-terminal-border": "#333333",
      "--color-positive": "#00ff00",
      "--color-negative": "#ff0000",
      "--color-neutral": "#00aaff",
      "--color-anomaly": "#ffff00",
      "--color-anomaly-glow": "rgba(255, 255, 0, 0.2)",
      "--color-text-primary": "#ffffff",
      "--color-text-secondary": "#cccccc",
      "--color-text-muted": "#666666",
    },
  },
];

interface ThemeState {
  themeId: string;
  setTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: "midnight",
      setTheme: (id) => set({ themeId: id }),
    }),
    { name: "encode-theme-v1" },
  ),
);

/** Apply a theme's CSS variables to the document root. */
export function applyTheme(themeId: string): void {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(key, value);
  }
}
