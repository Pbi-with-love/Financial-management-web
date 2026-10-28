/**
 * Distribute totalCents evenly among memberIds.
 * Remainder goes to the first N members (sorted by ID for determinism).
 * Invariant: all shares sum to exactly totalCents.
 */
export function splitEvenly(totalCents: number, memberIds: string[]): Map<string, number> {
  const sorted = [...memberIds].sort();
  const base = Math.floor(totalCents / sorted.length);
  const remainder = totalCents % sorted.length;
  const shares = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    shares.set(sorted[i], i < remainder ? base + 1 : base);
  }
  return shares;
}

/**
 * Validate that custom split shares sum exactly to totalCents.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateCustomSplit(
  shares: Map<string, number>,
  totalCents: number
): string | null {
  if (shares.size === 0) {
    return "Custom split must have at least one share";
  }

  for (const [memberId, amount] of shares) {
    if (!Number.isInteger(amount) || amount < 0) {
      return `Share for member "${memberId}" must be a non-negative integer, got ${amount}`;
    }
  }

  const sum = [...shares.values()].reduce((acc, v) => acc + v, 0);
  if (sum !== totalCents) {
    return `Custom split shares sum to ${sum} but item total is ${totalCents}`;
  }

  return null;
}
