# 06: Seed data

**What to build:** `prisma/seed.ts` that populates the database with demo data: 3 members (Alice, Bob, Charlie), several deposits, and multi-item expenses with different participants. The data should produce verifiable balances. Configure the seed command in package.json prisma config. Running `npx prisma db seed` populates the database and the app can be demo'd end-to-end with the frontend.

**Blocked by:** 04-deposits, 05-expenses

**Status:** ready-for-agent

- [ ] prisma/seed.ts creates 3 members: Alice, Bob, Charlie
- [ ] Creates deposits for each member
- [ ] Creates expenses with multi-item, different participant combinations
- [ ] package.json has prisma.seed config pointing to seed.ts
- [ ] `npx prisma db seed` runs without errors
- [ ] After seeding, `GET /members` returns correct balances
- [ ] `npm run build` passes
