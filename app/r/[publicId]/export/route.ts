import { headers } from "next/headers";
import { getReportByPublicId } from "@/lib/services";
import { LIMITS, rateLimit } from "@/lib/rateLimit";
import type { ReportSummary } from "@/lib/report";

export const dynamic = "force-dynamic";

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  if (!/^[a-f0-9]{16,64}$/.test(publicId)) {
    return new Response("Not found", { status: 404 });
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown").slice(0, 60);
  const share = await rateLimit(`share:${ip}`, "share", LIMITS.shareViewPerIpPerHour, 3_600_000);
  if (!share.allowed) {
    return new Response("Too many requests. Try again later.", { status: 429 });
  }

  const report = await getReportByPublicId(publicId);
  if (!report) return new Response("Not found", { status: 404 });

  const s = JSON.parse(report.summaryJson) as ReportSummary;
  const rows: string[][] = [
    ["section", "package", "ecosystem", "advisory_id", "severity", "fixed_in", "resolved_at", "verify_type", "verify_url"],
  ];
  const push = (section: string, items: ReportSummary["fixedSince"]) => {
    for (const f of items) {
      rows.push([
        section,
        f.package,
        f.ecosystem,
        f.advisoryId,
        f.severity,
        f.fixedInVersion ?? "",
        f.resolvedAt?.slice(0, 10) ?? "",
        f.verifyType ?? "",
        f.verifyUrl ?? "",
      ]);
    }
  };
  push("breached_open", s.breachedOpen);
  push("fixed", s.fixedSince);
  push("verified", s.verifiedSince);
  push("new", s.newSince);
  push("longest_open", s.oldestOpen);

  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patchledger-report-${publicId.slice(0, 12)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
