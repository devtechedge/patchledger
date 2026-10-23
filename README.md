# PatchLedger

Evidence-backed security maintenance records for client projects. Import `npm audit --json` or `osv-scanner --json` output, track every advisory with fix evidence and verified test runs, watch remediation SLAs, and generate a branded client-ready report with honest limitations. Not a scanner, not an audit - the proof layer after the alert.

## Status

Working MVP (2026-10-24): 37/37 tests, lint clean, production build green, local smoke verified. Not yet deployed. Free during pilot validation; billing not enabled.

## Quick start

```bash
npm install                 # also runs prisma generate
cp .env.example .env        # fill in Neon Postgres URLs + SESSION_PEPPER
npm run db:push             # create schema (use the UNPOOLED url for DDL)
npm run dev                 # http://localhost:3000
```

Optional: `npm run db:seed` creates a demo workspace (demo@patchledger.test / demo-password-1) with two imports, evidence, and a published sample report.

## Scripts

| Command | What it does |
|---------|--------------|
| npm run dev | Next dev server |
| npm run build / start | production build / serve |
| npm test | pushes schema to the test DB, then runs vitest (37 tests) |
| npm run lint | eslint |
| npm run db:push | prisma db push (set DATABASE_URL_UNPOOLED) |
| npm run db:seed | seed/refresh the demo workspace |

## Env vars

See .env.example. DATABASE_URL (pooled) at runtime; DATABASE_URL_UNPOOLED for DDL; DATABASE_URL_TEST(_UNPOOLED) for vitest; SESSION_PEPPER (32-byte hex) for password hashing; NEXT_PUBLIC_SITE_URL.

## Docs

docs/PROJECT_BRIEF.md - what and why. docs/IDEA_SCORECARD.md - evidence and alternatives with dated sources. docs/SECURITY.md - data flow, retention, controls. docs/NEXT_ACTIONS.md - open approval gates and next steps. docs/VALIDATION_LOG.md + EXPERIMENTS.md - validation state. docs/BILLING_AND_MRR.md - pricing path. docs/outreach/ - interview script and prospect criteria.
