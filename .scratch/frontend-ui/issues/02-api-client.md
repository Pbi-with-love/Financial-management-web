# 02: API client + formatCents utility

**What to build:** A typed API client module that wraps `fetch` with functions for every backend endpoint: list members (with balances), list expenses, create expense, void expense, list deposits, create deposit, void deposit, get member detail. Define TypeScript types for all request/response shapes matching the AGENT.md API contract (money as `*Cents` integers, ISO 8601 dates). Create a `formatCents(cents: number): string` utility that converts cent integers to euro display strings. Unit tests for `formatCents`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] API client module with typed functions for all endpoints
- [ ] TypeScript types for Member, Expense, Item, ItemShare, Deposit, Balance
- [ ] `formatCents` converts: `3000` → `€30.00`, `0` → `€0.00`, `-1500` → `-€15.00`, `1` → `€0.01`
- [ ] Unit tests for `formatCents` pass
- [ ] `npm run build` passes
