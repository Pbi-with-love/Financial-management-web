# 01: Project scaffolding + layout shell

**What to build:** Install React Router v7, TanStack Query, and shadcn/ui. Create a responsive layout shell: persistent sidebar on desktop (≥768px) with icon+label links for Dashboard, New Expense, History, Deposits; bottom tab bar on mobile (<768px) with the same links. Wire up all 5 routes (`/`, `/expenses/new`, `/history`, `/deposits`, `/members/:id`) with placeholder page components. The app should navigate between all pages with the layout always visible.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] React Router v7 installed and routes defined for all 5 paths
- [ ] TanStack Query provider wraps the app
- [ ] shadcn/ui initialized with Button, Card, Badge, Input, Checkbox, Select, Tabs components
- [ ] Desktop sidebar with nav links renders at ≥768px
- [ ] Mobile bottom tab bar renders at <768px
- [ ] All 5 routes render a placeholder page inside the layout shell
- [ ] `npm run build` passes
