# 03: Members — list with balances, create, deactivate

**What to build:** Full vertical slice for members: Zod validation schemas, repository with raw SQL for balance computation, service layer, controller, and routes. `GET /members` returns all members with computed `balanceCents`. `GET /members/:id` returns one member with nested deposits and itemShares. `POST /members` creates a member (requires name). `PATCH /members/:id` updates active status. Integration tests via Supertest prove each endpoint works.

**Blocked by:** 01-skeleton, 02-domain

**Status:** ready-for-agent

- [ ] `GET /members` returns `[{ id, name, active, createdAt, balanceCents }]`
- [ ] Balance computed as `sum(deposits) - sum(item_shares)` excluding voided, via raw SQL
- [ ] `GET /members/:id` returns member + deposits array + itemShares array
- [ ] `GET /members/:id` on unknown ID → 404
- [ ] `POST /members` with `{ name }` → 201 with the created member
- [ ] `POST /members` without name → 400
- [ ] `PATCH /members/:id` with `{ active: false }` → 200
- [ ] Integration tests for each endpoint
- [ ] `npm run build` and `npm test` pass
