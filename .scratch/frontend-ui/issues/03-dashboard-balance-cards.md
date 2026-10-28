# 03: Dashboard — member balance cards

**What to build:** Replace the Dashboard placeholder with a page that fetches all members with their computed balances via the API client and renders a responsive grid of balance cards. Each card shows the member's name and formatted balance. Positive/zero balances use a neutral/green style; negative balances are red. Tapping a card navigates to `/members/:id`. Loading spinner while fetching. Error message if the API fails.

**Blocked by:** 01-scaffolding, 02-api-client

**Status:** ready-for-agent

- [ ] Dashboard fetches members with balances from API client
- [ ] Balance cards render in a responsive grid (2 cols mobile, 3+ desktop)
- [ ] Negative balances shown in red, positive in green/neutral
- [ ] Tapping a card navigates to `/members/:id`
- [ ] Loading state shows spinner
- [ ] Error state shows message
- [ ] `npm run build` passes
