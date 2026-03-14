export function formatPrice(price: number, tickSize: number): string {
  if (tickSize >= 1) return price.toFixed(0);
  if (tickSize <= 0) return price.toFixed(2);
  const decimals = Math.max(0, -Math.floor(Math.log10(tickSize)));
  return price.toFixed(decimals);
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return (volume / 1_000_000).toFixed(1) + "M";
  if (volume >= 1_000) return (volume / 1_000).toFixed(1) + "K";
  return volume.toString();
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return sign + change.toFixed(2) + "%";
}

export function getDecimalsForTick(tickSize: number): number {
  if (tickSize >= 1) return 0;
  if (tickSize <= 0) return 2;
  return Math.max(0, -Math.floor(Math.log10(tickSize)));
}
