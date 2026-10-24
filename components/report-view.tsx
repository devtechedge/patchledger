import type { ReportSummary } from "@/lib/report";

export interface ReportBranding {
  agencyName: string;
  contactEmail: string;
  accentColor: string;
  clientName: string;
  projectName: string;
}

function Section({ title, index, children }: { title: string; index: string; children: React.ReactNode }) {
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)]">
      <h2 className="microlabel border-b border-[var(--border)] px-6 py-3">
        {index} / {title}
      </h2>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function FindingRows({
  items,
  empty,
}: {
  items: ReportSummary["fixedSince"];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="font-mono text-xs text-[var(--faint)]">{empty}</p>;
  }
  return (
    <ul className="grid gap-px bg-[var(--border)]">
      {items.map((f) => (
        <li key={`${f.ecosystem}-${f.package}-${f.advisoryId}`} className="bg-[var(--surface)] px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-sm font-semibold text-[var(--ink)]">{f.package}</span>
            <span
              className="border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                borderColor:
                  f.severity === "critical"
                    ? "var(--bad)"
                    : f.severity === "high"
                      ? "var(--warn)"
                      : "var(--faint)",
                color:
                  f.severity === "critical"
                    ? "var(--bad)"
                    : f.severity === "high"
                      ? "var(--warn)"
                      : "var(--muted)",
              }}
            >
              {f.severity}
            </span>
            <span className="font-mono text-[10px] text-[var(--faint)]">{f.advisoryId}</span>
          </div>
          <p className="mt-1 text-[var(--muted)]">{f.title}</p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[var(--faint)]">
            {f.fixedInVersion ? <span>fixed in {f.fixedInVersion}</span> : null}
            {f.fixUrl ? (
              <a href={f.fixUrl} className="underline" style={{ color: "var(--brand, var(--accent))" }}>
                fix reference
              </a>
            ) : null}
            {f.verifyUrl ? (
              <a href={f.verifyUrl} className="underline" style={{ color: "var(--brand, var(--accent))" }}>
                verification run ({f.verifyType ?? "evidence"})
              </a>
            ) : null}
            {f.verifyType && !f.verifyUrl ? <span>verified via {f.verifyType}</span> : null}
            {f.resolvedAt ? <span>resolved {f.resolvedAt.slice(0, 10)}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  npm_audit: "npm audit",
  osv_scanner: "osv-scanner",
};

/** Valid hex or the ledger amber fallback; text on the brand band flips to dark on light colors. */
export function brandColors(accentColor: string): { brand: string; onBrand: string } {
  const brand = /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#f59e0b";
  const n = parseInt(brand.slice(1), 16);
  const lum =
    (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return { brand, onBrand: lum > 0.55 ? "#17120a" : "#ffffff" };
}

/**
 * Renders the frozen report summary. Used by the public share page; the
 * summary passed in was fixed at generation time and never recomputed.
 * Styled as a formal document: sharp rules, mono data, amber accents.
 */
export function ReportView({
  branding,
  summary,
  agencyNote,
  title,
  periodLabel,
}: {
  branding: ReportBranding;
  summary: ReportSummary;
  agencyNote: string;
  title: string;
  periodLabel: string;
}) {
  const openCounts = Object.entries(summary.counts.bySeverity).filter(([, n]) => n > 0);
  const { brand, onBrand } = brandColors(branding.accentColor);

  return (
    <article
      className="mx-auto grid max-w-3xl gap-6 px-6 py-10"
      style={{ ["--brand" as string]: brand } as React.CSSProperties}
    >
      <header className="border-2 bg-[var(--surface)]" style={{ borderColor: brand }}>
        <div
          className="flex items-center justify-between px-8 py-3"
          style={{ background: brand, color: onBrand }}
        >
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]">
            {branding.agencyName || "Maintenance report"}
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em]">
            {periodLabel}
          </span>
        </div>
        <div className="px-8 py-7">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {branding.clientName ? `Prepared for ${branding.clientName} - ` : ""}
            project: {summary.project.name}
          </p>
          {summary.latestImport ? (
            <p className="mt-4 border-l-2 pl-3 font-mono text-xs text-[var(--faint)]" style={{ borderColor: brand }}>
              source of record: {SOURCE_LABEL[summary.latestImport.source] ?? summary.latestImport.source},{" "}
              imported {summary.latestImport.importedAt.slice(0, 10)} ({summary.latestImport.findingCount} advisories
              reported at import time). Report generated {summary.generatedAt.slice(0, 10)} - data as of that date.
            </p>
          ) : null}
        </div>
      </header>

      <Section title="Open findings" index="01">
        {openCounts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No open advisories from the latest import. This reflects the imported scanner output, not a
            security guarantee.
          </p>
        ) : (
          <div className="flex flex-wrap gap-px border border-[var(--border)] bg-[var(--border)]">
            {openCounts.map(([sev, n]) => (
              <div key={sev} className="min-w-[120px] flex-1 bg-[var(--surface)] px-4 py-4 text-center">
                <div className="font-display text-3xl font-semibold">{n}</div>
                <div className="microlabel mt-1">{sev}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`SLA compliance (critical ${summary.sla.criticalDays}d / high ${summary.sla.highDays}d / medium ${summary.sla.mediumDays}d)`} index="02">
        {summary.sla.tracked === 0 ? (
          <p className="text-sm text-[var(--muted)]">No SLA-tracked open findings right now.</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-display text-3xl font-semibold">{summary.sla.compliancePct}%</span>{" "}
              of open SLA-tracked findings are inside their target window ({summary.sla.within} of{" "}
              {summary.sla.tracked}; {summary.sla.breached} past due).
            </p>
            {summary.breachedOpen.length > 0 ? (
              <div className="mt-4">
                <p className="microlabel mb-2">Past due</p>
                <FindingRows items={summary.breachedOpen} empty="" />
              </div>
            ) : null}
          </>
        )}
      </Section>

      <Section title="Fixed in this period (recorded evidence)" index="03">
        <FindingRows items={summary.fixedSince} empty="Nothing was recorded as fixed in this period." />
      </Section>

      <Section title="Verified with a passing run" index="04">
        <FindingRows items={summary.verifiedSince} empty="No fixes carry verification evidence in this period." />
      </Section>

      <Section title="Newly reported in this period" index="05">
        <FindingRows items={summary.newSince} empty="No new advisories appeared in this period." />
      </Section>

      {summary.oldestOpen.length > 0 ? (
        <Section title="Longest-standing open items" index="06">
          <ul className="grid gap-1.5 font-mono text-xs text-[var(--muted)]">
            {summary.oldestOpen.map((f) => (
              <li key={`${f.ecosystem}-${f.package}-${f.advisoryId}`}>
                {f.package} ({f.severity}) - open for {f.daysOpen} day{f.daysOpen === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {agencyNote ? (
        <Section title="Note from us" index="07">
          <p className="whitespace-pre-line text-sm leading-6 text-[var(--muted)]">{agencyNote}</p>
        </Section>
      ) : null}

      <footer className="border border-[var(--border)] bg-[var(--surface-2)]">
        <h2 className="microlabel border-b border-[var(--border)] px-6 py-3">Scope and limitations</h2>
        <div className="px-6 py-5">
          <p className="font-mono text-xs leading-5 text-[var(--muted)]">{summary.limitations}</p>
          <p className="mt-4 font-mono text-xs text-[var(--faint)]">
            generated {summary.generatedAt.slice(0, 10)} by PatchLedger
            {branding.contactEmail ? ` - questions: ${branding.contactEmail}` : ""}
          </p>
        </div>
      </footer>
    </article>
  );
}
