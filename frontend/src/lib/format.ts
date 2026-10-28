/**
 * Converts a cent integer to a EUR display string.
 *
 * Examples:
 *   3000  → "€30.00"
 *   0     → "€0.00"
 *   -1500 → "-€15.00"
 *   1     → "€0.01"
 *   100   → "€1.00"
 *
 * Note: this function is for display only. Never use it for calculations.
 */
export function formatCents(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const euros = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const formatted = `€${euros}.${String(remainder).padStart(2, '0')}`;
  return negative ? `-${formatted}` : formatted;
}
