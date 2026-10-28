# 01: App skeleton + error handling + config

**What to build:** Restructure the Express backend into the layered architecture from AGENT.md. Split server.ts into app.ts (Express app with middleware, route mounting, error handler) and server.ts (dotenv + listen). Create AppError class and error-handling middleware that returns `{ error: message }` for known errors and a generic 500 for unknown ones. Create config.ts that validates env vars with Zod. Install Vitest + Supertest and configure a test script. The health check must still work. `npm run build` and `npm test` pass.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] app.ts creates Express app with cors, json, error middleware, exports it
- [ ] server.ts imports app, loads dotenv, calls listen
- [ ] config.ts validates PORT and DATABASE_URL with Zod
- [ ] AppError class with statusCode and message
- [ ] Error middleware: AppError → { error } with status; unknown → 500 generic
- [ ] Vitest + Supertest installed, vitest.config.ts configured
- [ ] package.json has "test": "vitest run" script
- [ ] Health check test passes via Supertest
- [ ] `npm run build` passes
- [ ] `npm test` passes
