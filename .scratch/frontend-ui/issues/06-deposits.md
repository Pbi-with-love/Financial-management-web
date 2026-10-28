# 06: Deposits page

**What to build:** Deposits page at `/deposits`. A list of all deposits sorted newest first, each row showing member name, formatted amount, date, and a "Voided" badge if applicable. Above the list, a "New Deposit" form: select member dropdown (active members only), amount input in euros, date picker (defaults to today), optional note. Submit creates the deposit via API client, refreshes the list on success, shows error on failure. Loading/error states for the list.

**Blocked by:** 01-scaffolding, 02-api-client

**Status:** ready-for-agent

- [ ] Deposit list renders newest first with member name, amount, date, voided badge
- [ ] "New Deposit" form with member select, amount, date, note
- [ ] Only active members in the dropdown
- [ ] Submit creates deposit and refreshes list
- [ ] Error handling on submit
- [ ] Loading and error states for the list
- [ ] `npm run build` passes
