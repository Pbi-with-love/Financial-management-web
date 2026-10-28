# 01: Schema — add revision columns + migration

**What to build:** Add two nullable self-referencing columns to the `expenses` table: `replaces_expense_id` (UUID, FK → expenses.id, unique) and `replaced_by_expense_id` (UUID, FK → expenses.id, unique). Run the migration. Update the frontend Expense TypeScript type to include `replacesExpenseId` and `replacedByExpenseId` (both nullable strings). Existing code and tests must still pass unchanged.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Prisma schema has `replacesExpenseId` and `replacedByExpenseId` nullable self-ref fields with `@unique`
- [ ] Migration applied successfully to the database
- [ ] Frontend `Expense` type includes `replacesExpenseId?: string | null` and `replacedByExpenseId?: string | null`
- [ ] `npm run build` passes in both backend and frontend
- [ ] All existing tests still pass
