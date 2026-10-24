# Next Actions

Updated: 2026-10-24 (hardening pass done). Live: https://patchledger.vercel.app, repo https://github.com/devtechedge/patchledger (git auto-deploy from main, CI green).

## Hardening pass 2026-10-24 (executed from the QA/PM/EM brief)

Fixed (all verified in CI against the production build): mobile overflow (tables scrollable, e2e guard at 375px), agency branding color rendered on reports, share-link rate limit (120/h/IP), OG/Twitter metadata + dynamic per-report share cards, robots.txt + sitemap, branded 404/error pages, security headers, authenticated write-path e2e incl. report revoke, password reset (single-use 15-min hashed tokens, neutral no-enumeration flow, console mailer), landing waitlist capture + Vercel Analytics, report print button + CSV export, dashboard loading skeletons, AA contrast tokens + focus-visible, CI e2e now runs against `next start`, Node 22 pinned (.nvmrc + engines), parser fixtures + edge tests, CONTRIBUTING.md, a11y (aria-current, table roles).
Production-only bugs found and fixed by this pass: mutating server actions lacked revalidatePath (stale server-rendered UI in prod builds); dashboard pages asserted a non-null session while the layout redirect runs in parallel (TypeError race on `next start`).

## Open gates (need Dev)

1. Email provider choice for password-reset delivery (console transport logs links server-side only until a provider is picked; consider Resend/Postmark - decision + approval needed).
2. Outreach batch #1 - approved but unsent; prospect list + personalized drafts next.
3. Custom domain (patchledger.com taken; .io/.app/.dev free) - purchase is Dev's call.
4. Social preview upload at repo Settings -> General (no API) - docs/screenshots/social-preview.png is committed.
5. GTM docs (IDEA_SCORECARD, outreach/, EXPERIMENTS) are public in a public repo - consider a private mirror or trimming outreach/ from the public repo (Dev's call; not moved unilaterally).
6. Waitlist entries: query directly via DB (no admin UI by design); first signal check after the community post goes out.

## Product next slices (after validation signals, in order)

1. Dependabot alerts JSON + GitHub Advisory export intake.
2. Teams (multi-user per agency).
3. Email delivery of reports on a schedule (needs the email provider).
4. Lemon Squeezy checkout + webhook once a pilot asks to pay (verified path: LS MoR, PayPal payouts for India).
