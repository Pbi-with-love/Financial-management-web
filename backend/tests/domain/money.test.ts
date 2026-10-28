import { describe, it, expect } from "vitest";
import { isPositiveInteger } from "../../src/domain/money";

describe("isPositiveInteger", () => {
  it("returns true for 3000", () => {
    expect(isPositiveInteger(3000)).toBe(true);
  });

  it("returns true for 1 (minimum valid cent amount)", () => {
    expect(isPositiveInteger(1)).toBe(true);
  });

  it("returns false for 0", () => {
    expect(isPositiveInteger(0)).toBe(false);
  });

  it("returns false for -1", () => {
    expect(isPositiveInteger(-1)).toBe(false);
  });

  it("returns false for 1.5 (decimal)", () => {
    expect(isPositiveInteger(1.5)).toBe(false);
  });

  it("returns false for '100' (string)", () => {
    expect(isPositiveInteger("100")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isPositiveInteger(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPositiveInteger(undefined)).toBe(false);
  });

  it("returns false for NaN", () => {
    expect(isPositiveInteger(NaN)).toBe(false);
  });
});
