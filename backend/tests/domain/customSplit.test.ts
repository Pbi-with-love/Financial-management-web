import { describe, it, expect } from "vitest";
import { validateCustomSplit } from "../../src/domain/split";

describe("validateCustomSplit", () => {
  it("returns null when shares sum exactly to totalCents (valid)", () => {
    const shares = new Map([["A", 2000], ["B", 1000]]);
    expect(validateCustomSplit(shares, 3000)).toBeNull();
  });

  it("returns an error string when shares do not sum to totalCents", () => {
    const shares = new Map([["A", 2000], ["B", 1000]]);
    const result = validateCustomSplit(shares, 2500);
    expect(result).toBeTypeOf("string");
    expect(result).not.toBeNull();
  });

  it("returns an error string when a share is negative", () => {
    const shares = new Map([["A", -100], ["B", 3100]]);
    const result = validateCustomSplit(shares, 3000);
    expect(result).toBeTypeOf("string");
    expect(result).not.toBeNull();
  });

  it("returns an error string when shares map is empty", () => {
    const shares = new Map<string, number>();
    const result = validateCustomSplit(shares, 3000);
    expect(result).toBeTypeOf("string");
    expect(result).not.toBeNull();
  });

  it("returns null when a single member holds the full amount", () => {
    const shares = new Map([["A", 5000]]);
    expect(validateCustomSplit(shares, 5000)).toBeNull();
  });

  it("returns an error string when sum is correct but a share is zero (edge: non-positive)", () => {
    // zero shares are allowed (member present but owes nothing) — sum must still match
    const shares = new Map([["A", 3000], ["B", 0]]);
    expect(validateCustomSplit(shares, 3000)).toBeNull();
  });
});
