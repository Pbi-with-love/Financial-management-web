# 02: Domain logic — splitEvenly + money validation

**What to build:** Pure domain functions with full unit test coverage. `splitEvenly(totalCents, memberIds)` distributes cents using floor division with remainder going to the first N members sorted by ID. `isPositiveInteger(n)` validates cent amounts. `validateCustomSplit(shares, totalCents)` checks that custom split amounts sum exactly to the item total. All test cases from AGENT.md must pass.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `splitEvenly(4000, [A, B, C])` → A:1334, B:1333, C:1333, sum = 4000
- [ ] `splitEvenly(3000, [A, B, C])` → 1000 each
- [ ] `splitEvenly(X, [A])` → A gets full amount
- [ ] Members sorted by ID for deterministic remainder distribution
- [ ] `isPositiveInteger` rejects 0, negatives, decimals, strings
- [ ] `validateCustomSplit` rejects when shares don't sum to item amount
- [ ] `validateCustomSplit` accepts when shares sum exactly
- [ ] All functions are pure — no Prisma, no Express
- [ ] `npm run build` passes
- [ ] `npm test` passes with all unit tests green
