# 04: Deposits — create, list, void

**What to build:** Full vertical slice for deposits. `POST /deposits` creates a deposit (validates positive amountCents, valid memberId, ISO date). `GET /deposits` lists all deposits sorted newest first. `POST /deposits/:id/void` sets voided=true and voidedAt=now() idempotently. Integration tests prove: deposit increases balance; voiding reverts balance; voiding twice is a no-op.

**Blocked by:** 03-members

**Status:** ready-for-agent

- [ ] `POST /deposits` with `{ memberId, amountCents, date, note? }` → 201
- [ ] Validates amountCents is positive integer
- [ ] Validates memberId exists
- [ ] Validates date is ISO 8601 string
- [ ] `GET /deposits` returns deposits sorted by date desc
- [ ] `POST /deposits/:id/void` sets voided=true, voidedAt=now()
- [ ] Voiding twice returns same result, no error
- [ ] Voided deposit excluded from member balance
- [ ] Integration test: create deposit → balance goes up → void → balance reverts
- [ ] `npm run build` and `npm test` pass
