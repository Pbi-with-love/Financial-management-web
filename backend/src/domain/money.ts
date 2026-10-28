/**
 * Check if value is a positive integer (valid cent amount).
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
