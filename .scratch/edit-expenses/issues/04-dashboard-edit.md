# 04: Dashboard — today's expenses with expandable items + inline edit

**What to build:** Change the Dashboard's "Recent expenses" section to show only today's expenses (filtered by browser local date from the data returned by `useRecentExpenses`). Each expense row is expandable — clicking toggles an expanded view showing items with description, formatted amount, participant names, and each person's share amount. An "Edit" button in the expanded view makes all item amounts editable (number inputs). "Save" sends `PUT /expenses/:id/revise` with the full items array (same participants, updated amounts). On success: invalidate queries so balances and list refresh. On 409: show "This expense was already edited" error and refetch. "Cancel" reverts inputs. A "View all" link under the section navigates to `/history`. Update the frontend API client to add a `reviseExpense(id, items)` function and a `useReviseExpense` mutation hook.

**Blocked by:** 02-revise-endpoint

**Status:** ready-for-agent

- [ ] Dashboard shows only today's expenses (browser local date filter)
- [ ] Empty state: "No expenses today" when none match
- [ ] Expense rows are expandable — click toggles item details
- [ ] Expanded view shows: item description, amount, participants, each share
- [ ] "Edit" button toggles item amounts to number inputs
- [ ] "Save" calls revise endpoint with updated items
- [ ] On success: queries invalidate, balances and list refresh
- [ ] On 409: shows error message, refetches data
- [ ] "Cancel" reverts to read-only view
- [ ] "View all" link navigates to /history
- [ ] Frontend API client has `reviseExpense` function and `useReviseExpense` hook
- [ ] `npm run build` passes
