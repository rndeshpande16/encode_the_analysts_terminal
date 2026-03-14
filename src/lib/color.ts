export function hslInterpolate(
  value: number,
  min: number,
  max: number,
): string {
  // Maps value from [min, max] to a hue from red (0) through yellow (60) to green (120)
  const clamped = Math.max(min, Math.min(max, value));
  const ratio = (clamped - min) / (max - min || 1);
  const hue = ratio * 120; // 0=red, 60=yellow, 120=green
  return `hsl(${hue}, 70%, 45%)`;
}

export function sentimentColor(changePercent: number): string {
  if (changePercent > 0) return hslInterpolate(changePercent, 0, 5);
  if (changePercent < 0) return hslInterpolate(-changePercent, 5, 0);
  return "hsl(220, 10%, 45%)";
}

export function heatmapColor(changePercent: number): string {
  const clamped = Math.max(-5, Math.min(5, changePercent));
  if (clamped >= 0) {
    const intensity = clamped / 5;
    return `rgba(34, 197, 94, ${0.1 + intensity * 0.6})`;
  }
  const intensity = -clamped / 5;
  return `rgba(239, 68, 68, ${0.1 + intensity * 0.6})`;
}
