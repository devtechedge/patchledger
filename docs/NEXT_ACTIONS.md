# Next Actions

Updated: 2026-10-24 (session 1 end). Everything external needs explicit approval before doing.

## Awaiting Dev approval (blocking validation)

1. Outreach batch #1 (25-40 personalized messages + 1 community post) - drafts ready in docs/outreach/.
2. Deploy to Vercel (new project `patchledger`, team devtechedge1; env vars: DATABASE_URL pooled, SESSION_PEPPER fresh 32B hex, NEXT_PUBLIC_SITE_URL; postinstall prisma generate already configured - reuse CareProof's deploy checklist).
3. GitHub repo (public devtechedge/patchledger or private - Dev's call; secret-scan history before any push).
4. Trademark/domain check for "PatchLedger" before anything public uses the name.
5. Lemon Squeezy (or equivalent MoR) eligibility + fee verification for India-based founder before enabling billing. Until then: pricing page says pilot-free.

## Ready to execute without further decisions once approved

- Outreach: send batch #1, log replies in EXPERIMENTS.md.
- Deploy: vercel project + env push + smoke (health, signup, import, share link) + seed demo.
- Repo: init remote, push granular history.

## Product next slices (after validation signals, in order)

1. Dependabot alerts JSON + GitHub Advisory export intake (bigger surface than npm audit CLI).
2. pip-audit / cargo audit intake (osv-scanner already covers multi-ecosystem; verify demand first).
3. CSV/JSON export of findings + evidence (clients ask for machine-readable evidence).
4. Multi-user teams (today: single account per agency).
5. Email delivery of reports on a schedule (needs an email provider decision).

## Session 1 state (for resuming)

- App complete and green: 37/37 tests, lint clean, build green, prod smoke passed on :3112.
- Demo seeded in main DB (demo@patchledger.test / demo-password-1; sample report /r/ffcbff31732032a6c1e5830c42ad4d9c).
- Local repo at C:\Users\Devayan Mandal\.zcode\workspace\60dd58ee-d137-4c3a-9e28-d1fe61fd0bff\patchledger with git history (local only, not pushed).
- .env local only (never committed); .env.example documents all vars.
