# Contributing

PatchLedger is a commercial product in active validation; the source is public for review and transparency. Issues and pull requests are welcome for concrete bugs. Feature ideas are better sent as an issue first - the roadmap is deliberately small.

## Setup

```bash
npm install          # also runs prisma generate
cp .env.example .env # fill in Neon Postgres URLs + SESSION_PEPPER
npm run db:push      # schema (use the UNPOOLED url for DDL)
npm test             # pushes schema to the test DB, then vitest
npm run dev          # http://localhost:3000
```

A dedicated throwaway Postgres database for tests is required (`DATABASE_URL_TEST(_UNPOOLED)`); the suite truncates it. Local runs from far regions need the 30s timeouts already set in vitest.config.mjs.

## Scripts

| Command | What it does |
| --- | --- |
| npm run dev / build / start | dev server / production build / serve |
| npm test | schema push to test DB + vitest |
| npm run typecheck | next typegen + tsc --noEmit |
| npm run lint | eslint |
| npm run db:push / db:seed | schema / demo workspace seed |
| npx playwright test | browser e2e (needs a running DB) |

## Ground rules

- Small, named commits, one concern each. No "polish" dumps.
- Every test, typecheck and lint pass must stay green; CI runs unit + typecheck + lint + build + Playwright against the production build.
- Never commit secrets. `.env` is gitignored; rotate anything that leaks.
- Shared reports (`/r/*`) must never claim to prove security. The limitations statement in `lib/report.ts` is a product requirement, not boilerplate - do not weaken it.
- The evidence semantics are validated behavior: `fixed` requires fix evidence, `verified` requires a passing run, auto-closure is always labelled and never verified. Propose changes in an issue before touching `lib/report.ts` or `lib/merge.ts`.
