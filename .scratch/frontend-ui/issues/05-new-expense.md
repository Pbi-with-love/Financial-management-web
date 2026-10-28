# 05: New Expense form

**What to build:** Full expense creation page at `/expenses/new`. Top fields: title (required), date (required, defaults to today), note (optional). Items section: starts with one empty item card. Each item has: description (required), amount in euros (user types e.g. `30.00`), category (optional), participant checkboxes showing only active members (none pre-checked, at least one required). "Add item" button appends a new item card. "Remove item" on each card (disabled when only one remains). Running total at the bottom computed from item amounts for display. Inline validation errors. Submit converts euro amounts to cents and sends the payload. On success: navigate to dashboard. On error: show API error message.

**Blocked by:** 01-scaffolding, 02-api-client

**Status:** ready-for-agent

- [ ] Title, date (defaulting to today), and note fields render
- [ ] Item cards with description, amount, category, participant checkboxes
- [ ] Only active members shown as participants, none pre-checked
- [ ] "Add item" adds a new item card; "Remove item" removes (disabled at 1 item)
- [ ] Running total updates as amounts change
- [ ] Inline validation: required fields, at least one participant per item
- [ ] Euro-to-cents conversion on submit (e.g. `30.00` → `3000`)
- [ ] Success navigates to dashboard; error shows message
- [ ] `npm run build` passes
