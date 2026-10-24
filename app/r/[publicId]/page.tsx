import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReportByPublicId } from "@/lib/services";
import { LIMITS, rateLimit } from "@/lib/rateLimit";
import type { ReportBranding } from "@/components/report-view";
import { ReportView } from "@/components/report-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrintButton } from "@/components/print-button";
import type { ReportSummary } from "@/lib/report";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/r/[publicId]">): Promise<Metadata> {
  const { publicId } = await params;
  const base: Metadata = {
    title: "Maintenance report - PatchLedger",
    robots: { index: false, follow: false },
  };
  if (!/^[a-f0-9]{16,64}$/.test(publicId)) return base;
  try {
    const report = await getReportByPublicId(publicId);
    if (!report) return base;
    const b = JSON.parse(report.brandingJson) as ReportBranding;
    const s = JSON.parse(report.summaryJson) as ReportSummary;
    const title = `Security maintenance report - ${s.project.name} - ${b.agencyName || "PatchLedger"}`;
    const description = `${s.counts.openTotal} open finding${s.counts.openTotal === 1 ? "" : "s"} as of ${s.generatedAt.slice(0, 10)}: ${s.fixedSince.length} fixed, ${s.verifiedSince.length} verified with a passing run in this period. Shared by ${b.agencyName || "the agency"}.`;
    return {
      ...base,
      title,
      description,
      openGraph: { title, description, type: "article" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return base;
  }
}

export default async function PublicReportPage({
  params,
}: PageProps<"/r/[publicId]">) {
  const { publicId } = await params;
  if (!/^[a-f0-9]{16,64}$/.test(publicId)) notFound();

  // scraping guard for unlisted share links (render-level block; the page
  // cannot set a 429 status from a server component)
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown").slice(0, 60);
  const share = await rateLimit(`share:${ip}`, "share", LIMITS.shareViewPerIpPerHour, 3_600_000);
  if (!share.allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="border border-[var(--border)] bg-[var(--surface)] px-8 py-10 text-center">
          <p className="microlabel">Rate limited</p>
          <p className="mt-3 font-mono text-sm text-[var(--muted)]">
            Too many requests from this address. Try again later.
          </p>
        </div>
      </div>
    );
  }

  const report = await getReportByPublicId(publicId);
  if (!report) notFound();

  const branding = JSON.parse(report.brandingJson) as ReportBranding;
  const summary = JSON.parse(report.summaryJson) as ReportSummary;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <div className="no-print border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
            shared record - unlisted link
          </span>
          <div className="flex items-center gap-3">
            <a
              href={`/r/${publicId}/export`}
              className="border border-[var(--border-strong)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              CSV
            </a>
            <PrintButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <ReportView
        branding={branding}
        summary={summary}
        agencyNote={report.agencyNote}
        title={report.title}
        periodLabel={report.periodLabel}
      />
      <footer className="no-print border-t border-[var(--border)] bg-[var(--surface)] py-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
        prepared with PatchLedger - evidence, not promises
      </footer>
    </div>
  );
}
