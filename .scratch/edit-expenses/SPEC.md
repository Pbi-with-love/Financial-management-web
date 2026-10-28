# Spec: Edit Item Amounts + Date-Range History

## Problem Statement

Users cannot correct a mistake in an expense after it's created — the only option is voiding the whole expense and re-entering it from scratch. The Dashboard shows the last 10 expenses regardless of date, making it hard to see today's activity. The History page shows all records with no way to filter by date range, member, or category.

## Solution

1. **Dashboard recent expenses → today only.** The Dashboard shows only today's expenses (browser local date), expandable to show items with descriptions, amounts, participants, and per-person shares.

2. **Edit item amounts.** On an expanded expense, an "Edit" button makes all item amounts editable inline. Saving creates a **revision**: in one database transaction, the old expense is voided and a new expense is created with corrected items, linked via `replacesExpenseId` / `replacedByExpenseId`. Shares are recomputed server-side. Optimistic concurrency: the server rejects with 409 if the expense being edited is already voided or replaced.

3. **History with date range + filters.** A "View all" link on the Dashboard navigates to History, which now has a date range picker (default: last 30 days), a member filter, and a category filter. All filtering is server-side via query parameters. Revised expenses show an "Edited" badge with an expandable view of the previous version; the voided original is hidden from the default list.

## User Stories

1. As a group member, I want the Dashboard to show only today's expenses, so that I see what happened today without scrolling past old records.
2. As a group member, I want to expand a today's expense to see its items with description, amount, participants, and each person's share, so that I can verify the breakdown.
3. As a group member, I want to tap "Edit" on an expanded expense and change the amount of any item inline, so that I can fix a mistake without re-entering the whole expense.
4. As a group member, I want the edited item's shares to be recalculated automatically by the server using the same participants and splitting rule, so that the correction is exact.
5. As a group member, I want the expense total to update after editing, so that the ledger stays accurate.
6. As a group member, I want everyone's balance on the Dashboard to update immediately after I save an edit, so that the correction is reflected right away.
7. As a group member, I want the system to prevent two people from editing the same expense at the same time, so that one edit doesn't silently overwrite another — the second save should show an error.
8. As a group member, I want a "View all" link under today's expenses that takes me to the History page, so that I can see older transactions.
9. As a group member, I want a date range picker on the History page (from / to) defaulting to the last 30 days, so that I can focus on a specific period.
10. As a group member, I want to filter History by member, so that I can see only transactions involving a specific person.
11. As a group member, I want to filter History by category, so that I can see how much was spent on e.g. "Food" or "Drinks".
12. As a group member, I want edited expenses in History to show an "Edited" badge, so that I know a correction was made.
13. As a group member, I want to click the "Edited" badge to see the previous version of the expense, so that I can compare what changed.
14. As a group member, I want the voided original of an edited expense to be hidden from the default History view, so that the list isn't cluttered with duplicates.
15. As a group member, I want filters (date, member, category) to work together, so that I can narrow down to exactly the transactions I'm looking for.
16. As a group member, I want the date range to persist when I navigate away and come back to History, so that I don't have to re-enter it.

## Implementation Decisions

### Schema change

Add two nullable self-referencing columns to the `expenses` table:

- `replaces_expense_id` (UUID, FK → expenses.id, unique) — points to the old expense this one replaces.
- `replaced_by_expense_id` (UUID, FK → expenses.id, unique) — points to the new expense that replaced this one.

Unique constraints ensure one-to-one: an expense can only be replaced once and can only replace one other. Both are set in the same transaction that voids the old and creates the new.

### API: Revise endpoint

`PUT /expenses/:id/revise`

Request body:
```
{
  items: [
    { description: string, amountCents: number, category?: string, participantIds: string[] }
  ]
}
```

Behavior:
1. Find the expense by `:id`. Reject with 409 if already voided or replaced.
2. In one transaction: void the old expense, create a new expense with the same title/date/note but updated items, compute new splits via `splitEvenly`, set `replacesExpenseId` on the new expense, set `replacedByExpenseId` on the old expense.
3. Return the new expense with 200.

The client sends the full items array (not a diff). Participants stay the same per the edit-scope decision, but the server validates them anyway.

### API: Query parameter extensions

`GET /expenses` gains:
- `?from=YYYY-MM-DD` — expenses on or after this date
- `?to=YYYY-MM-DD` — expenses on or before this date
- `?category=Food` — expenses containing at least one item with this category
- `?memberId=<uuid>` — expenses where this member has at least one item share
- `?includeVoided=false` (default false) — exclude voided expenses unless explicitly requested

`GET /deposits` gains:
- `?from=YYYY-MM-DD`
- `?to=YYYY-MM-DD`
- `?memberId=<uuid>`

`GET /expenses/:id` response now includes `replacesExpenseId` and `replacedByExpenseId` (nullable). When `replacesExpenseId` is set, the response also nests the previous expense as `replacedExpense` (with its items and shares).

### Frontend: Dashboard changes

- Filter `useRecentExpenses` results to today's local date in the component.
- Each expense row is expandable (click to toggle). Expanded view shows items with description, formatted amount, participant names, and each share amount.
- "Edit" button in the expanded view. Clicking it turns item amounts into number inputs. "Save" calls `PUT /expenses/:id/revise`. "Cancel" reverts. On 409: show "This expense was already edited by someone else" and refetch.
- After successful save: invalidate members and expenses queries (TanStack Query) so balances and the list refresh.

### Frontend: History changes

- Date range picker: two date inputs (from/to), default from = 30 days ago, to = today.
- Member filter: dropdown of all members.
- Category filter: dropdown of distinct categories (fetched from a new `GET /categories` endpoint, or extracted client-side from loaded expenses).
- Filters are query parameters in the URL for shareability and persistence on navigation.
- Revised expenses: show "Edited" badge. Clicking it expands to show the previous version's items inline (fetched via the nested `replacedExpense` in the API response).
- Voided originals that have a `replacedByExpenseId` are excluded from the list (the backend's `includeVoided=false` default handles this).

### Category list

Rather than a separate endpoint, the frontend extracts distinct categories from the currently loaded expenses. This avoids a new endpoint for a simple filter.

## Testing Decisions

### Testing seams

Same as existing: HTTP layer via Supertest for backend, API client mock for frontend. No new seams.

### What makes a good test

Test the revision lifecycle end-to-end: create an expense, revise it, verify the old is voided with `replacedByExpenseId`, the new has correct splits and `replacesExpenseId`, and balances reflect the change. Test the 409 rejection. Test date/member/category filters return correct subsets.

### Modules to test

**Backend (integration via Supertest):**
- `PUT /expenses/:id/revise` — happy path, 409 on already-voided, 409 on already-replaced, validation errors
- `GET /expenses` with `from`, `to`, `category`, `memberId` filters — correct filtering
- `GET /deposits` with `from`, `to`, `memberId` — correct filtering
- Revision creates correct links between old and new expense
- Balance changes after revision match expectations

**Frontend (component tests, if added):**
- Dashboard shows only today's expenses
- Edit mode toggles, Save calls revise endpoint, Cancel reverts
- History filters update URL params and refetch

### Prior art

Existing `tests/expenses.test.ts` and `tests/deposits.test.ts` cover create/void/list patterns. New tests follow the same structure.

## Out of Scope

- Changing an item's participants during edit (only amounts change).
- Adding or removing items during edit (same items, different amounts).
- Editing expense title, date, or note.
- Editing deposits.
- Undo/redo or multi-step revision history.
- Pagination on History (full list within date range is acceptable for a small group).
- Real-time updates (polling or WebSocket) — manual refresh via TanStack Query invalidation.

## Further Notes

- The revision pattern (void old + create new + link) preserves the full audit trail per AGENT.md's "never hard-delete" rule. The ledger stays intact.
- The `replacesExpenseId` / `replacedByExpenseId` pair is a singly-linked chain. If expense A is revised to B, then B is revised to C: A.replacedByExpenseId = B, B.replacesExpenseId = A, B.replacedByExpenseId = C, C.replacesExpenseId = B. Only the latest (C) appears in the default History view.
- The 409 concurrency guard is simple but sufficient for a small group. It prevents the race condition where two users edit the same expense simultaneously — the second save sees the expense is already voided and gets a clear error.
