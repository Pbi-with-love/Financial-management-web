# 02: Revise expense endpoint (backend)

**What to build:** `PUT /expenses/:id/revise` that in one transaction: (1) rejects with 409 if the expense is already voided or has a `replacedByExpenseId`, (2) voids the old expense, (3) creates a new expense with the same title/date/note but updated items, computes new splits via `splitEvenly`, (4) sets `replacesExpenseId` on the new expense and `replacedByExpenseId` on the old. Returns the new expense with 200. Also update `GET /expenses/:id` to nest `replacedExpense` (the previous version with its items and shares) when `replacesExpenseId` is set. Validation: same rules as create (participantIds required, active members, positive amountCents). The request body is `{ items: [...] }` — full items array, not a diff.

**Blocked by:** 01-schema-revision

**Status:** ready-for-agent

- [ ] `PUT /expenses/:id/revise` creates a revision in one transaction
- [ ] Old expense is voided with `replacedByExpenseId` pointing to new
- [ ] New expense has `replacesExpenseId` pointing to old
- [ ] Shares recomputed via `splitEvenly` with same participants
- [ ] `totalCents` recomputed from new item amounts
- [ ] Returns 409 if expense is already voided or already replaced
- [ ] Returns 404 if expense not found
- [ ] Validates items (positive amountCents, valid participantIds)
- [ ] `GET /expenses/:id` nests `replacedExpense` when `replacesExpenseId` is set
- [ ] Integration test: revise → old voided, new correct, balances updated
- [ ] Integration test: revise already-voided → 409
- [ ] Integration test: double revise (two fast saves) → second gets 409
- [ ] `npm run build` and `npm test` pass
