# Backend Spec: Finance Management API

## Problem Statement

The backend has a Prisma schema and a health check endpoint. No business logic, no API routes, no validation, no tests. The frontend is built and expects a full REST API to fetch members with balances, create expenses with item-level splitting, record deposits, void records, and view transaction history.

## Solution

Build the complete Express API following AGENT.md's layered architecture (`route → controller → service → repository → PostgreSQL`). Every request is validated with Zod. Money is always cents. Balances are computed from the ledger, never stored. Expenses are created in a single transaction with server-computed splits. Voiding is a soft-delete. Tests cover all domain rules.

## User Stories

1. As the frontend, I want to `GET /members` and receive all members with their computed `balanceCents`, so the dashboard can render balance cards.
2. As the frontend, I want to `GET /members/:id` and receive a member with their deposits and item shares, so the member detail page can render.
3. As the frontend, I want to `POST /members` with a name to create a new member.
4. As the frontend, I want to `PATCH /members/:id` to deactivate a member (`active: false`).
5. As the frontend, I want to `GET /expenses` to list all expenses with their items and item shares, so the history page can render.
6. As the frontend, I want to `GET /expenses?limit=N` to get the N most recent expenses for the dashboard.
7. As the frontend, I want to `POST /expenses` with a title, date, optional note, and an array of items (each with description, amountCents, optional category, and participantIds), so the server computes splits and creates everything in one transaction.
8. As the frontend, I want to `POST /expenses/:id/void` to void an expense, which excludes it from balance computations but keeps it in history.
9. As the frontend, I want to `GET /deposits` to list all deposits for the deposits page.
10. As the frontend, I want to `POST /deposits` with memberId, amountCents, date, and optional note to record a deposit.
11. As the frontend, I want to `POST /deposits/:id/void` to void a deposit.
12. As a developer, I want validation errors returned as `400 { "error": "message" }` so the frontend can display them.
13. As a developer, I want the `splitEvenly` function to distribute cents exactly with no rounding loss.
14. As a developer, I want custom splits validated — the server rejects them if amounts don't sum to the item total.
15. As a developer, I want seed data (3 members, deposits, expenses) so I can test the app end-to-end.

## Implementation Decisions

### Architecture

Four layers per AGENT.md:
- **Routes** (`src/routes/`): path + method registration only, delegates to controllers.
- **Controllers** (`src/controllers/`): parse request, call service, format response, pass errors to `next(err)`.
- **Services** (`src/services/`): business logic — splitting, voiding, balance computation.
- **Repositories** (`src/repositories/`): Prisma queries only, no business rules.

Additional modules:
- **Domain** (`src/domain/`): `money.ts` (cent helpers), `split.ts` (splitEvenly and custom split validation).
- **Validation** (`src/validation/`): Zod schemas for every request body and query string.
- **Errors** (`src/errors/`): `AppError` class + error-handling middleware.
- **Config** (`src/config.ts`): environment variables validated with Zod.

### App structure

- `src/app.ts`: Express app creation, middleware (cors, json, routes, error handler).
- `src/server.ts`: dotenv loading, app import, listen.

### API Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/members` | — | `MemberWithBalance[]` |
| `GET` | `/members/:id` | — | `MemberWithBalance` + deposits + itemShares |
| `POST` | `/members` | `{ name }` | `Member` |
| `PATCH` | `/members/:id` | `{ active }` | `Member` |
| `GET` | `/expenses` | `?limit=N` | `Expense[]` (with items and itemShares) |
| `POST` | `/expenses` | `{ title, date, note?, items[] }` | `Expense` |
| `POST` | `/expenses/:id/void` | — | `Expense` |
| `GET` | `/deposits` | — | `Deposit[]` |
| `POST` | `/deposits` | `{ memberId, amountCents, date, note? }` | `Deposit` |
| `POST` | `/deposits/:id/void` | — | `Deposit` |
| `GET` | `/health` | — | `{ status, database }` |

### Domain: splitEvenly

`splitEvenly(totalCents: number, memberIds: string[]): Map<string, number>`
- `base = Math.floor(total / n)`, `remainder = total % n`
- First `remainder` members (sorted by ID) get `base + 1`
- Invariant: all shares sum to exactly `totalCents`

### Domain: custom splits

When the client sends explicit `shares` per item instead of `participantIds`, the server validates that the shares sum to exactly the item's `amountCents`. Rejects with 400 otherwise.

### Expense creation

One transaction:
1. Validate all items: each has description, positive amountCents, at least one participantId referencing an active member.
2. Compute `totalCents = sum(item.amountCents)`.
3. For each item: compute shares via `splitEvenly` (or validate custom shares).
4. Insert expense, items, and item_shares in one Prisma `$transaction`.

### Balance computation

Raw SQL in the repository:
```sql
SELECT m.id, m.name, m.active, m.created_at,
  COALESCE(d.total, 0) - COALESCE(s.total, 0) AS balance_cents
FROM members m
LEFT JOIN (SELECT member_id, SUM(amount_cents) AS total FROM deposits WHERE voided = false GROUP BY member_id) d ON m.id = d.member_id
LEFT JOIN (SELECT member_id, SUM(amount_cents) AS total FROM item_shares s JOIN items i ON s.item_id = i.id JOIN expenses e ON i.expense_id = e.id WHERE e.voided = false GROUP BY member_id) s ON m.id = s.member_id
```

### Voiding

- Sets `voided = true` and `voidedAt = now()`.
- Idempotent: voiding twice returns the same result, no error.
- No cascade needed — the expense/deposit row stays, shares stay, but voided records are excluded from balance queries.

### Participant validation

- `participantIds` is required on every item, must be non-empty.
- Each ID must reference an existing, active member.
- No duplicates within an item.
- Rejected with 400 if any rule is violated.

### Error handling

- `AppError` class with `statusCode` and `message`.
- Error middleware catches `AppError` → returns `{ error: message }` with the status code.
- Unknown errors → 500 with generic message, details logged server-side.

### Seed data

`prisma/seed.ts` creates:
- 3 members: Alice, Bob, Charlie
- Deposits and expenses matching the README worked example so balances can be verified against it.

## Testing Decisions

### Testing seam

The service layer is the primary testing seam. Domain functions (`splitEvenly`, custom split validation) are tested as pure units. Services are tested with a real database (integration tests via Supertest hitting the HTTP layer).

### What makes a good test

Test the contract: given this input, the API returns this output and the database reflects this state. Don't test Prisma internals or Express middleware wiring.

### Modules to test

- **`domain/split.ts`** (unit): `splitEvenly(4000, [A,B,C])` → 1334,1333,1333; `splitEvenly(3000, [A,B,C])` → 1000 each; single participant; custom split validation.
- **`domain/money.ts`** (unit): cent validation helpers.
- **Expense creation** (integration): multi-item expense, different participants, correct per-member totals; validation failures (no participants, inactive member, negative amount) → 400 and nothing written (transaction rollback).
- **Voiding** (integration): voided expense excluded from balance; void twice → no error.
- **Balance** (integration): deposits minus shares matches expected value.

### Prior art

No existing tests. Will use Vitest + Supertest, matching the frontend's Vitest setup.

## Out of Scope

- Authentication / password gate.
- Pagination (small group, full lists acceptable for v1).
- Rate limiting.
- File uploads.
- WebSocket / real-time updates.
- Custom split UI in the frontend (backend supports it, frontend doesn't use it yet).

## Further Notes

- The frontend API client at `frontend/src/api/client.ts` already defines the expected request/response shapes. The backend must match those types exactly.
- Express v5 is installed (not v4) — route params and async error handling work differently.
- The Prisma schema is already migrated to Neon. No schema changes needed.
