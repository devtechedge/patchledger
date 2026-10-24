import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReportByPublicId } from "@/lib/services";
import type { ReportBranding } from "@/components/report-view";
import { ReportView } from "@/components/report-view";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ReportSummary } from "@/lib/report";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maintenance report - PatchLedger",
  robots: { index: false, follow: false },
};

export default async function PublicReportPage({
  params,
}: PageProps<"/r/[publicId]">) {
  const { publicId } = await params;
  if (!/^[a-f0-9]{16,64}$/.test(publicId)) notFound();

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
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
              generated {report.createdAt.toISOString().slice(0, 10)}
            </span>
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
