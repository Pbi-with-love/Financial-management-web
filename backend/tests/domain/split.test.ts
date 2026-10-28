import { describe, it, expect } from "vitest";
import { splitEvenly } from "../../src/domain/split";

describe("splitEvenly", () => {
  it("distributes 4000 among A, B, C — A gets the extra cent", () => {
    const result = splitEvenly(4000, ["A", "B", "C"]);
    expect(result.get("A")).toBe(1334);
    expect(result.get("B")).toBe(1333);
    expect(result.get("C")).toBe(1333);
  });

  it("distributes 3000 evenly among A, B, C — 1000 each", () => {
    const result = splitEvenly(3000, ["A", "B", "C"]);
    expect(result.get("A")).toBe(1000);
    expect(result.get("B")).toBe(1000);
    expect(result.get("C")).toBe(1000);
  });

  it("single participant gets the full amount", () => {
    const result = splitEvenly(5000, ["X"]);
    expect(result.get("X")).toBe(5000);
  });

  it("distributes 1 cent among 3 members — only the first sorted member gets it", () => {
    const result = splitEvenly(1, ["A", "B", "C"]);
    expect(result.get("A")).toBe(1);
    expect(result.get("B")).toBe(0);
    expect(result.get("C")).toBe(0);
  });

  it("sorts member IDs for deterministic remainder assignment regardless of input order", () => {
    // Input order: C, A, B — sorted: A, B, C
    // 2 cents / 3 members => base=0, remainder=2 => A:1, B:1, C:0
    const result = splitEvenly(2, ["C", "A", "B"]);
    expect(result.get("A")).toBe(1);
    expect(result.get("B")).toBe(1);
    expect(result.get("C")).toBe(0);
  });

  it("invariant: shares always sum exactly to totalCents", () => {
    const cases: [number, string[]][] = [
      [4000, ["A", "B", "C"]],
      [3000, ["A", "B", "C"]],
      [5000, ["X"]],
      [1, ["A", "B", "C"]],
      [2, ["C", "A", "B"]],
      [99, ["member-1", "member-2", "member-3", "member-4", "member-5"]],
      [10000, ["alpha", "beta"]],
    ];

    for (const [total, members] of cases) {
      const shares = splitEvenly(total, members);
      const sum = [...shares.values()].reduce((acc, v) => acc + v, 0);
      expect(sum, `sum for total=${total}, members=${members.join(",")}`).toBe(total);
    }
  });
});
