export const metadata = { title: "Privacy - PatchLedger" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 text-xs text-[var(--faint)]">
        Working document - legal review pending before any paid launch.
      </p>
      <div className="mt-6 grid gap-4 text-sm leading-6 text-[var(--muted)]">
        <p>
          PatchLedger stores: your account email, a salted scrypt hash of your password, your
          agency profile (name, branding color, contact email), your projects, and the scanner
          JSON you choose to paste (package names, versions, advisory identifiers). We never ask
          for repository access, tokens, or your source code, and the product sends nothing to
          third-party AI services - parsing and reporting are deterministic.
        </p>
        <p>
          Data flow: pasted scanner output is parsed server-side, reduced to advisory-level
          findings, and stored against your account. Shared report links contain an unguessable
          random id, are marked noindex, and can be revoked at any time (a revoked link returns
          404).
        </p>
        <p>
          Retention and deletion: everything is kept until you delete it. Deleting your account
          (Account page, type DELETE) removes your projects, findings, snapshots, reports,
          sessions and audit rows in one operation. There is no backup beyond the operational
          database snapshot regime documented in SECURITY.md.
        </p>
        <p>
          Logs: authentication and import actions are recorded in an internal audit trail visible
          to you on the Account page. Audit entries store labels and counts only - never raw
          scanner payloads.
        </p>
        <p>
          Contact: reply to the email you signed up with, or the address on your report footer.
        </p>
      </div>
    </div>
  );
}
