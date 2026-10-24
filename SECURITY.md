# Security Overview

PatchLedger is deliberately read-only and least-privilege: it never asks for repository access or credentials to customer systems, makes no outbound requests to scanned systems, and never opens PRs or issues anywhere. The only input is scanner JSON the user pastes. There is no AI in the processing path and nothing is sent to third-party APIs.

Full details live in [docs/SECURITY.md](docs/SECURITY.md). Summary of the honest current state:

## Authentication and sessions

- Email and password. Passwords hashed with scrypt (16-byte salt, 64-byte key, peppered via the `SESSION_PEPPER` environment variable), compared with `timingSafeEqual`.
- Sessions are database rows keyed by the SHA-256 of a 256-bit random token in an HttpOnly, SameSite=Lax cookie (Secure in production), 30-day expiry.
- No email verification, password reset, or OAuth yet. That is accepted MVP risk, recorded here on purpose.

## Authorization and tenancy

- Every database query in the service layer is scoped by `accountId`. Cross-tenant reads and mutations return not-found, and this is covered by tests, not just convention.
- All mutations happen in server actions that re-check the session first.

## Input handling

- Pasted scanner JSON is capped at 2 MB, parsed with strict `JSON.parse`, and shape-checked against the npm-audit and osv-scanner schemas. Anything else is rejected with a generic error.
- Imported content is treated as untrusted data: parsed defensively, rendered as inert text, never executed, and the raw payload is never stored (only normalized finding rows and a counts-only snapshot summary).
- Evidence links must be http(s) URLs and are parsed with `URL`. Severity, status and verification types are whitelists. SLA day values are integers 0-365, validated at both the action and service layers.

## Rate limits

DB-backed sliding windows: signup 5/IP/day, login 20/email/hour and 20/IP/hour, import 20/account/hour, report generation 15/account/hour, shared-report views 120/IP/hour, password-reset requests 5/email/hour and 20/IP/hour. Failed logins write no rows for unknown emails, so the audit log cannot be used to enumerate accounts, and responses are identical for unknown email versus wrong password.

## Reporting honesty rules

All imported advisories are scanner claims, not confirmed exploitable issues. `fixed` means fix evidence was recorded; `verified` means a passing test/build/deploy run was recorded on top. Auto-closure on re-import is labelled automatic and can never reach `verified`. Every client report carries a fixed limitations statement. The product never claims to prove security.

## Secrets

`DATABASE_URL` and `SESSION_PEPPER` live only in the local gitignored `.env` and the hosting provider's encrypted environment variables. No secrets are committed; history was secret-scanned before the first push.

## Reporting a vulnerability

Open a private security advisory on this repository, or contact the email shown on a generated report footer. Please do not open public issues for suspected vulnerabilities.
