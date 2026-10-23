# PatchLedger - Project Brief

Updated: 2026-10-24. Working name "PatchLedger"; trademark/domain NOT checked. Do before anything public.

## One line

PatchLedger turns the vulnerability-scanner output small dev agencies already produce (npm audit, osv-scanner) into an evidence-backed remediation record - triage, fix evidence, verification evidence, SLA status - and a branded, client-ready maintenance report at the end.

## Why this product (evidence summary; full sources in IDEA_SCORECARD.md)

- Enterprise buyers push security requirements down to small vendors: questionnaires, SOC 2 flow-down (r/SaaS "$40k deal" Mar 2026), 30-day remediation SLAs in MSAs, cyber-insurance patching questions, SBOM procurement terms.
- Scanner alert fatigue is chronic and documented 2021-2026 ("Turn Dependabot off" HN ~Feb 2026, 647 pts; r/devsecops Jun 2026 "fix alerts before the SLA blows up"; GitHub's own noise-mitigation blog Apr 2025).
- The "client-facing proof" artifact sells in adjacent verticals (ManageWP $1/site reports, Patchstack ~$69/mo WordPress agency tier, MSP tools marketing "prove your value") and is absent from the entire dev dependency-security category (Snyk, GHAS, Socket, Aikido, Semgrep, Mend, Endor, Corgea, GitGuardian: none, checked 2026-10-24).
- Remediation-tracking platforms (Nucleus, Vulcan/Tenable, Brinqa) start around $24k/yr - the small-team end is unserved.

## What it is / is not

Is: a deterministic record-keeping and reporting layer over imported scanner JSON. Read-only by design: no repo access, no tokens, no scanning, no AI in the data path, no code leaves the user's machine except pasted audit output.

Is not: a scanner, an audit, a certification, or a guarantee of security. Every report carries an explicit limitations statement. "Fixed" = recorded evidence; "verified" = recorded passing test/build run. Auto-closure on re-import is labelled as auto and never marked verified.

## ICP (initial)

Dev agencies and studios (2-30 people) in US/UK/EU serving enterprise or regulated clients (fintech, health, gov-adjacent) on maintenance retainers ($500+/mo), plus boutique SaaS teams selling up-market. NOT the local-SMB-website segment (evidence shows those clients rarely ask).

Trigger events: a client security questionnaire arrives; an MSA with remediation SLAs; a supply-chain incident email ("are we affected?"); annual pen-test findings; SOC 2 flow-down.

## Core workflow

1. Import: paste `npm audit --json` or `osv-scanner --json` (2 MB cap, server-side validation, format auto-detect).
2. Deterministic merge: advisory-level dedupe by (ecosystem, package, advisory id); reappearing advisories reopen; same-source advisories that vanish auto-close as fixed (auto-labelled); cross-source disappearance never auto-closes.
3. Evidence: status transitions require evidence (fix reference/note for fixed; verification type + run link/note for verified; reason for false-positive/accepted).
4. SLA: per-project severity targets (default 14/30/90 days), breach flags, compliance %.
5. Report: frozen summary + branded share link (noindex, revocable), limitations included.

## Stack

Next.js 16.4 App Router, React 19, Tailwind 4, Prisma 7.10.1 + @prisma/adapter-pg on Neon Postgres (databases `patchledger` + `patchledger_test` on the shared us-east-1 host), Vitest 5. Same architecture as CareProof (proven deploy path).

## Status (2026-10-24, session 1)

- 37/37 tests green, lint clean, `next build` green, local prod smoke verified (health, landing, auth guard 307, sample report 200, bogus share id 404).
- Demo workspace seeded in the main DB: demo@patchledger.test / demo-password-1, sample report live at /r/ffcbff31732032a6c1e5830c42ad4d9c.
- NOT deployed, NOT pushed to GitHub, zero outreach. All of those need explicit approval (see NEXT_ACTIONS.md).
