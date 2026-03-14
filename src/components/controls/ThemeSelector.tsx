import { useState, useRef, useEffect } from "react";
import { useThemeStore, THEMES, applyTheme } from "../../stores/theme-store.ts";
import type { Theme } from "../../stores/theme-store.ts";

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (id: string) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded border border-[var(--color-terminal-border)] bg-[var(--color-terminal-panel)] px-2 py-0.5 text-xs transition-colors hover:bg-slate-700"
        style={{ color: "var(--color-text-secondary)" }}
        title="Change theme"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="m12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        Theme
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-[min(14rem,calc(100vw-2rem))] overflow-hidden rounded-lg border shadow-xl"
          style={{
            backgroundColor: "var(--color-terminal-surface)",
            borderColor: "var(--color-terminal-border)",
          }}
        >
          <div
            className="border-b px-3 py-2 text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: "var(--color-text-muted)",
              borderColor: "var(--color-terminal-border)",
            }}
          >
            Color Theme
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {THEMES.map((theme) => (
              <ThemeOption
                key={theme.id}
                theme={theme}
                active={theme.id === themeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeOption({
  theme,
  active,
  onSelect,
}: {
  theme: Theme;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const colors = theme.colors;
  return (
    <button
      onClick={() => onSelect(theme.id)}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors hover:brightness-110"
      style={{
        backgroundColor: active ? "var(--color-terminal-panel)" : "transparent",
      }}
    >
      {/* Color preview dots */}
      <div className="flex gap-0.5">
        <span
          className="h-3 w-3 rounded-full border border-black/20"
          style={{ backgroundColor: colors["--color-terminal-bg"] }}
        />
        <span
          className="h-3 w-3 rounded-full border border-black/20"
          style={{ backgroundColor: colors["--color-positive"] }}
        />
        <span
          className="h-3 w-3 rounded-full border border-black/20"
          style={{ backgroundColor: colors["--color-negative"] }}
        />
        <span
          className="h-3 w-3 rounded-full border border-black/20"
          style={{ backgroundColor: colors["--color-neutral"] }}
        />
      </div>
      <span
        className="text-[11px] font-medium"
        style={{
          color: active
            ? "var(--color-text-primary)"
            : "var(--color-text-secondary)",
        }}
      >
        {theme.name}
      </span>
      {active && (
        <svg
          className="ml-auto"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-positive)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
