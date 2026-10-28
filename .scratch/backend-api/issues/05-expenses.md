# 05: Expenses — create with splits, list, void

**What to build:** Full vertical slice for expenses. `POST /expenses` accepts title, date, note?, and items array. Each item has description, amountCents, category?, and participantIds. Server computes totalCents as sum of items, computes item shares via splitEvenly, and creates everything in one Prisma transaction. `GET /expenses` lists expenses with nested items and itemShares (supports `?limit=N`). `POST /expenses/:id/void` voids. Validates participantIds: required, non-empty, active members only, no duplicates. Integration tests prove correct splits, transaction rollback on validation failure, and voiding excludes from balance.

**Blocked by:** 03-members, 02-domain

**Status:** ready-for-agent

- [ ] `POST /expenses` creates expense + items + item_shares in one transaction
- [ ] Server computes totalCents from items (never trusts client)
- [ ] Server computes item shares via splitEvenly
- [ ] participantIds required, non-empty, must be active members, no duplicates
- [ ] Validation failure → 400, nothing written (transaction rollback)
- [ ] `GET /expenses` returns expenses with items and itemShares
- [ ] `GET /expenses?limit=5` returns only 5 most recent
- [ ] `POST /expenses/:id/void` sets voided=true idempotently
- [ ] Voided expense excluded from member balances
- [ ] Integration test: multi-item expense with different participants → correct per-member balances
- [ ] Integration test: invalid participantIds → 400, no records created
- [ ] `npm run build` and `npm test` pass
