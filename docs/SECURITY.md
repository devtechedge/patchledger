# Security & Data Handling

Updated: 2026-10-24.

## Trust model

PatchLedger is read-only and least-privilege by design: it never asks for repository access, tokens, or credentials to customer systems, never makes outbound requests to scanned systems, and never opens PRs or issues anywhere. The only input is scanner JSON the user pastes. There is no AI in any processing path and nothing is ever sent to a model or third-party API. No paid data dependencies.

## Data flow and retention

1. User pastes scanner JSON (client-side textarea; optional local file read stays in the browser until submit).
2. Server validates: 2 MB cap, strict JSON.parse, shape sniffing against npm-audit/osv-scanner schemas only; anything else is rejected with a generic error. Imported content is treated as untrusted data - it is parsed defensively (no eval, no dynamic merge into objects), rendered as inert text, and never executed.
3. Parsed advisories reduce to finding rows (package name, version, advisory id, severity, fix info). The raw pasted JSON is NOT stored - only the snapshot summary (counts) and finding rows persist.
4. Reports freeze summary + branding JSON at generation; share links use a 128-bit random hex id, are served noindex/nofollow, and revoke to 404 immediately.
5. Deletion: account deletion cascades sessions, projects, snapshots, findings, reports, audit events, and rate-limit rows referencing the account/email, in one transaction. There is no soft-delete and no other copy of tenant data. Backups: none beyond the database provider's standard snapshot regime (documented limitation until a dedicated Neon project exists).

## Finding classification (honesty rules)

- All imported advisories are exactly that: advisories reported by the chosen scanner at import time. They are not confirmed exploitable issues.
- `fixed` = the agency recorded fix evidence (reference link or note). `verified` = additionally a recorded passing test/build/deploy run. Auto-closure on re-import is explicitly labelled as automatic and is never verified.
- `false_positive` / `accepted` require a written reason; they stay visible with their reason rather than disappearing.
- Every client report carries the fixed limitations statement: source scanner + date + scope, and "not a penetration test, code audit, or security certification".

## Application security controls

- Auth: email + scrypt password hashing (16B salt, peppered via SESSION_PEPPER env, timing-safe compare), 30-day DB-backed sessions (sha256 of a 256-bit token in an HttpOnly, SameSite=Lax cookie; Secure in production).
- Authorization: every service-layer query is scoped by accountId (tenant isolation tested: cross-tenant reads/mutations 404). Server actions re-check the session before any mutation.
- Rate limits (DB sliding window): signup 5/IP/day, login 10/email/hour + 20/IP/hour, import 20/account/hour, report 15/account/hour. Failed logins write no rows for unknown emails (no account enumeration via audit log; responses are identical for unknown email vs wrong password).
- Validation: all form input length-capped and type-checked server-side; evidence URLs must be http(s) and are URL-parsed; severity/status/verify-type whitelists enforced; SLA days integer 0-365 (validated at action AND service layer).
- Errors: user-facing messages are generic and safe; no stack traces or internal details in responses.
- Audit trail: signup/login/logout/import/status-change/report-create/revoke/account-update recorded with labels and counts only - never raw imported payloads.
- Secrets: SESSION_PEPPER and DATABASE_URL live only in .env (gitignored) / hosting env vars. .env.example documents generation. No secrets in code or history (repo is secret-scanned before any push).
- Legal: privacy + terms pages ship as working documents flagged for legal review before paid launch; refund/cancellation policy stated there.

## What PatchLedger must never do

- Never imply a scan/report proves security.
- Never test, scan, or probe external targets.
- Never publish findings, create PRs/issues, or disclose anything without explicit approval.
- Never send customer data to AI models or third parties.

## Known limitations (accepted for MVP)

- Single-user accounts (no team seats) - tenant = one agency login.
- Installed versions are absent from npm-audit JSON (limitation of the format; osv-scanner provides them).
- Cascade-only npm audit entries are skipped (root advisory is captured on the owning package).
- No email verification/password reset yet (no email provider chosen).
