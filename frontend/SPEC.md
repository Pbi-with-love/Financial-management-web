# Frontend Spec: Finance Management UI

## Problem Statement

A small group shares a fund — members deposit money, expenses are entered item by item, and each item is split among the members who used it. Currently there is no UI: only a backend with a health check endpoint and a database schema. Members have no way to see their balances, record deposits, create expenses, or review history.

## Solution

Build a mobile-first React frontend that connects to the Express backend API. Five pages cover the full workflow: a dashboard showing balances at a glance, a form to create multi-item expenses with per-item participant selection, a transaction history view, a deposits page, and a per-member detail page. All money is displayed in euros, formatted from the cent integers the API returns. The frontend never computes shares or totals — it sends participant lists and amounts to the server, which owns the splitting logic.

## User Stories

1. As a group member, I want to see every member's current balance on a dashboard, so that I know who owes the fund and who has credit.
2. As a group member, I want negative balances displayed in red, so that debts are immediately obvious.
3. As a group member, I want to see a list of recent expenses on the dashboard, so that I have a quick overview of recent activity.
4. As a group member, I want to navigate between pages using a bottom tab bar on mobile, so that the app feels native on my phone.
5. As a group member, I want to navigate using a sidebar on desktop, so that all pages are accessible in one click.
6. As a group member, I want to create a new expense with a title, date, and optional note, so that I can record a shopping trip or payment.
7. As a group member, I want to add multiple items to an expense, each with a description, amount, and optional category, so that I can break down what was bought.
8. As a group member, I want to select which members participated in each item via checkboxes, so that only the people who used it are charged.
9. As a group member, I want to dynamically add and remove items from the expense form before submitting, so that I can handle any number of line items.
10. As a group member, I want to see the running total of all items update as I fill out the form, so that I can verify the expense before submitting.
11. As a group member, I want form validation errors shown inline (e.g. missing description, zero amount, no participants selected), so that I can fix mistakes before submitting.
12. As a group member, I want to see a confirmation or error message after submitting an expense, so that I know whether it was recorded.
13. As a group member, I want to record a deposit for a specific member with an amount, date, and optional note, so that fund contributions are tracked.
14. As a group member, I want to see a full transaction history (expenses and deposits) with the most recent first, so that I can review all activity.
15. As a group member, I want voided transactions to appear in the history with a visual "voided" badge, so that the audit trail is visible.
16. As a group member, I want to void an expense or deposit from its detail view, so that mistakes can be corrected without deleting history.
17. As a group member, I want to tap a member's name or balance card to see their detail page, so that I can review one person's activity.
18. As a group member, I want the member detail page to show that member's deposits, item shares, and computed balance, so that I can audit their position.
19. As a group member, I want all money amounts displayed as euros (e.g. €30.00), formatted from cent integers, so that I see human-readable values.
20. As a group member, I want loading spinners while data is being fetched, so that I know the app is working.
21. As a group member, I want a clear error message when the API is unreachable or returns an error, so that I'm not staring at a blank screen.
22. As a group member, I want the expense form to only offer active members as participants, so that deactivated members aren't accidentally included.
23. As a group member, I want the app to work well on a phone screen (grocery store, on the go), so that I can enter expenses in the moment.

## Implementation Decisions

### Routing

React Router v7 with five routes:

- `/` — Dashboard
- `/expenses/new` — NewExpense form
- `/history` — Transaction history
- `/deposits` — Deposits list and new deposit form
- `/members/:id` — MemberDetail

### Data Fetching

TanStack Query manages all server state. Each API entity (members, expenses, deposits) gets its own query key. Mutations for creating expenses, recording deposits, and voiding records use `useMutation` with query invalidation on success.

### Component Library

shadcn/ui components (copied into the project, not an npm dependency). Used for: Button, Input, Card, Table, Checkbox, Dialog, Badge, Form, Select, Tabs. Tailwind CSS handles all custom styling on top.

### Navigation

A responsive layout shell:
- Desktop (≥768px): persistent left sidebar with icon + label links for each page.
- Mobile (<768px): bottom tab bar with icons for Dashboard, New Expense, History, Deposits.
- MemberDetail is reached by tapping a member card, not from the nav bar directly.

### API Client Layer

A typed module in `src/api/` that wraps `fetch`. Each function maps to one backend endpoint. All request/response types are defined here. The rest of the app imports only from this module — never calls `fetch` directly. Money fields arrive as `*Cents` integers; the API client returns them as-is. Formatting to `€XX.XX` happens in a shared `formatCents()` display utility.

### Money Display

A single `formatCents(cents: number): string` utility that converts e.g. `3000` → `€30.00`. Used everywhere money is rendered. Negative values render with a minus sign and red text via a CSS class.

### NewExpense Form

- Top-level fields: title (required), date (required, defaults to today), note (optional).
- Items section: starts with one empty item. "Add item" button appends another. Each item has: description (required), amount in euros (user types `30.00`, form converts to `3000` cents before sending), category (optional), participant checkboxes (only active members shown, at least one required).
- "Remove item" button on each item (disabled when only one item remains).
- A running total displayed at the bottom, computed client-side for display only (server recomputes authoritatively).
- Submit sends the full expense payload in one request. On success: navigate to history or dashboard. On error: show the API error message.

### Deposits Page

- List of all deposits (newest first), showing member name, amount, date, voided status.
- A "New Deposit" form (inline or modal): select member, enter amount, pick date, optional note.

### History Page

- Unified list of expenses and deposits, sorted by date descending.
- Each expense row shows title, total, date, number of items.
- Each deposit row shows member name, amount, date.
- Voided records shown with a strikethrough or "Voided" badge, visually distinct.
- Tapping an expense expands or navigates to show its items and per-member shares.

### Dashboard

- A grid/list of member balance cards. Each card: member name, computed balance in euros, colored red if negative, green/neutral if positive.
- Tapping a card navigates to `/members/:id`.
- Below the cards: a "Recent expenses" list (last 5–10), each showing title, total, date.

### MemberDetail Page

- Header: member name, current balance (red if negative).
- Two sections (tabs or stacked): Deposits and Item Shares.
- Deposits list: amount, date, note, voided status.
- Item shares list: item description, expense title, share amount, date.

### Currency

Hardcoded EUR (€). No locale or currency configuration.

### Auth

Deferred. No password gate in this implementation. All pages are open.

## Testing Decisions

### Testing Seam

The API client layer (`src/api/`) is the single testing seam. Page-level tests mock this module to control what data the components see, verifying that pages render correctly, handle loading/error states, and submit the right payloads.

### What Makes a Good Test

Test external behavior visible to the user, not implementation details. A good test answers: "If a user did X, would they see Y?" Tests should not assert on internal state, hook call counts, or DOM structure beyond what the user perceives. Test the contract between the page and the API client — what the page requests and what it renders — not how it manages that data internally.

### Modules to Test

- **Dashboard**: renders member balances (positive, negative, zero), shows recent expenses, navigates to member detail on card click.
- **NewExpense**: validates required fields, adds/removes items dynamically, shows participant checkboxes for active members only, converts euro input to cents, displays running total, handles submit success and error.
- **Deposits**: renders deposit list, creates new deposit with correct payload, shows voided deposits with badge.
- **History**: renders mixed expenses and deposits in date order, voided items are visually distinct.
- **MemberDetail**: shows correct balance, lists deposits and item shares for the specific member.
- **formatCents**: unit tests — `3000` → `€30.00`, `0` → `€0.00`, `-1500` → `-€15.00`, `1` → `€0.01`.

### Prior Art

No existing frontend tests in the repo. Tests will use Vitest (already the project's test runner) with React Testing Library for component tests.

## Out of Scope

- Backend API implementation (routes, controllers, services, repositories) — this spec covers only the frontend.
- Authentication / password gate — deferred to a later spec.
- Member management UI (creating, deactivating members) — members are managed outside this scope.
- Custom splits — the UI assumes even splitting. Custom split UI can be added later.
- Editing an expense (void + re-create) — the UI supports voiding; re-creation is a separate workflow.
- Pagination or infinite scroll — the group is small; full lists are acceptable for v1.
- Offline support or PWA features.
- Dark mode (unless shadcn/ui provides it by default).
- i18n / multi-language support.

## Further Notes

- The backend API does not yet exist beyond a health check. The frontend should be built against the API contract defined in AGENT.md (endpoint patterns, request/response shapes, money-as-cents convention). The typed API client layer makes it easy to connect once the backend routes are built.
- AGENT.md and README.md disagree on whether item participants default to all active members or must be explicitly chosen. AGENT.md (the authoritative source for agents) says **no implicit default** — participants are required and must be explicitly selected. The UI enforces this: no checkboxes are pre-checked.
- The `formatCents` utility must never be used for calculation — only for display. All arithmetic stays on the server.
