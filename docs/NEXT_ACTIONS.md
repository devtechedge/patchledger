# Next Actions

Updated: 2026-10-24 (session 1 end + deploy session). Live: https://patchledger.vercel.app, repo https://github.com/devtechedge/patchledger (git auto-deploy from main, verified).

## Closed this session (2026-10-24, Dev approved)

2. Deploy to Vercel - DONE: project `patchledger` (team devtechedge1), env vars set as Secrets (DATABASE_URL pooled, SESSION_PEPPER matching the seeded demo, NEXT_PUBLIC_SITE_URL), prod smoke verified (health/db-up, landing + sample link, dashboard 307, report 200, bad id 404).
3. GitHub repo - DONE: public devtechedge/patchledger, history secret-scanned before push (clean), 5 + deploy commits.
4. Name check - BEST-EFFORT DONE: no USPTO web-indexed hits for "PatchLedger"; patchledger.com registered; .io/.app/.dev free (RDAP 2026-10-24). Proper trademark clearance (TESS/EUIPO/UKIPO) still open before paid marketing. Domain purchase needs approval (costs money).
5. Lemon Squeezy verification - DONE (official docs 2026-10-24): fees 5% + 50c/txn, $0/mo, MoR handles global VAT/sales-tax liability. India: bank payouts require Stripe pre-approval (Stripe India is invite-only for new accounts since May 2024 - LS docs state this exactly); PayPal payouts are the supported route for India (200+ countries; PayPal confirms INR receive/withdraw). Conclusion: Lemon Squeezy via PayPal payouts is usable; checkout not built yet (no customers).

## Awaiting Dev (blocking validation)

1. Outreach batch #1 (25-40 personalized messages + 1 community post) - APPROVED 2026-10-24 but not sent: sending must come from Dev's mailbox (interview script + message skeleton in docs/outreach/). Next session: build the prospect list from public sources (PROSPECT_CRITERIA.md) and draft the personalized batch for Dev to send.
6. Custom domain purchase (patchledger.io or .app) - needs approval; .com is taken.

## Product next slices (after validation signals, in order)

1. Dependabot alerts JSON + GitHub Advisory export intake (bigger surface than npm audit CLI).
2. pip-audit / cargo audit intake (osv-scanner already covers multi-ecosystem; verify demand first).
3. CSV/JSON export of findings + evidence (clients ask for machine-readable evidence).
4. Multi-user teams (today: single account per agency).
5. Email delivery of reports on a schedule (needs an email provider decision).
6. Lemon Squeezy checkout + webhook once a pilot asks to pay.
