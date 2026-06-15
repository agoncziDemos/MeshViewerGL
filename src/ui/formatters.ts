export function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "0.000";
}
