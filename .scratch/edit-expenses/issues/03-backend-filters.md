# 03: Date/member/category filters on expenses + deposits (backend)

**What to build:** Extend `GET /expenses` to accept query parameters: `from` (ISO date, inclusive), `to` (ISO date, inclusive), `category` (string, filters to expenses with at least one item matching), `memberId` (UUID, filters to expenses where this member has an item share), `includeVoided` (boolean, default false — hides voided expenses; expenses with `replacedByExpenseId` are also hidden unless includeVoided is true). Extend `GET /deposits` to accept: `from`, `to`, `memberId`. All filters compose (AND logic). Integration tests for each filter and combinations.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `GET /expenses?from=2026-10-01` returns only expenses on or after that date
- [ ] `GET /expenses?to=2026-10-15` returns only expenses on or before that date
- [ ] `GET /expenses?from=...&to=...` returns expenses in range
- [ ] `GET /expenses?category=Food` returns expenses with at least one item in that category
- [ ] `GET /expenses?memberId=<uuid>` returns expenses where member has a share
- [ ] `GET /expenses` defaults to `includeVoided=false` — hides voided and replaced expenses
- [ ] `GET /expenses?includeVoided=true` includes voided expenses
- [ ] `GET /deposits?from=...&to=...` filters deposits by date range
- [ ] `GET /deposits?memberId=<uuid>` filters deposits by member
- [ ] Filters compose correctly (AND logic)
- [ ] Integration tests for each filter
- [ ] `npm run build` and `npm test` pass
