interface PulseIndicatorProps {
  active?: boolean;
  color?: string;
}

export function PulseIndicator({
  active = false,
  color = "var(--color-positive)",
}: PulseIndicatorProps) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: active ? "var(--color-anomaly)" : color }}
      />
      {active && (
        <span
          className="animate-pulse-ring absolute inset-0 rounded-full"
          style={{ backgroundColor: "var(--color-anomaly)" }}
        />
      )}
    </span>
  );
}
