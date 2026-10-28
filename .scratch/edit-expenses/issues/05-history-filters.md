# 05: History — date range picker + filters + edited badge

**What to build:** Rebuild the History page with: (1) Date range picker — two date inputs (from/to), defaulting to last 30 days. (2) Member filter dropdown populated from `useMembers`. (3) Category filter dropdown populated from distinct categories extracted from loaded expenses. (4) All filters stored as URL search params (persist on navigation, shareable). (5) Fetches expenses and deposits using the backend filter query params (`from`, `to`, `memberId`, `category`). (6) Revised expenses (those with `replacesExpenseId`) show an "Edited" badge. Clicking the badge expands to show the previous version's items inline (from the nested `replacedExpense` in the API response). (7) Voided originals that were replaced are hidden (backend default). Update frontend API hooks to pass filter params.

**Blocked by:** 02-revise-endpoint, 03-backend-filters

**Status:** ready-for-agent

- [ ] Date range picker with from/to inputs, default last 30 days
- [ ] Member filter dropdown (all members from `useMembers`)
- [ ] Category filter dropdown (distinct categories from loaded data)
- [ ] Filters stored as URL search params
- [ ] Expenses and deposits fetched with filter query params
- [ ] Revised expenses show "Edited" badge
- [ ] Clicking "Edited" badge expands to show previous version items
- [ ] Voided originals with replacements are hidden
- [ ] Filters compose (selecting member + date range + category works)
- [ ] Frontend API hooks pass filter params to backend
- [ ] `npm run build` passes
