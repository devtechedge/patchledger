import { ImageResponse } from "next/og";
import { getReportByPublicId } from "@/lib/services";
import type { ReportBranding } from "@/components/report-view";
import type { ReportSummary } from "@/lib/report";

export const alt = "Shared security maintenance report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function ReportOgImage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  let agency = "Maintenance report";
  let project = "";
  let period = "";
  let open = 0;
  let brand = "#f59e0b";
  let generated = "";
  try {
    const report = await getReportByPublicId(publicId);
    if (report) {
      const b = JSON.parse(report.brandingJson) as ReportBranding;
      const s = JSON.parse(report.summaryJson) as ReportSummary;
      agency = b.agencyName || agency;
      project = s.project.name;
      period = report.periodLabel;
      open = s.counts.openTotal;
      if (/^#[0-9a-fA-F]{6}$/.test(b.accentColor)) brand = b.accentColor;
      generated = s.generatedAt.slice(0, 10);
    }
  } catch {
    // fall through with defaults; never leak whether an id exists
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0c0f14",
          color: "#e8ecf2",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "20px 72px",
            background: brand,
            color: "#17120a",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 5,
          }}
        >
          <div>{agency.toUpperCase()}</div>
          <div>{period.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", flex: 1 }}>
          <div style={{ fontSize: 24, color: "#9aa6b6", letterSpacing: 5 }}>SHARED MAINTENANCE REPORT</div>
          <div style={{ marginTop: 20, fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>{project || "Security maintenance report"}</div>
          <div style={{ marginTop: 32, display: "flex", gap: 20 }}>
            <div
              style={{
                display: "flex",
                padding: "12px 28px",
                border: "1px solid #37424f",
                background: "#12161d",
                fontSize: 24,
                color: "#9aa6b6",
              }}
            >
              {open} open finding{open === 1 ? "" : "s"}
            </div>
            {generated ? (
              <div
                style={{
                  display: "flex",
                  padding: "12px 28px",
                  border: "1px solid #37424f",
                  background: "#12161d",
                  fontSize: 24,
                  color: "#9aa6b6",
                }}
              >
                data as of {generated}
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ padding: "24px 72px", fontSize: 20, color: "#64707f", letterSpacing: 4 }}>
          PATCHLEDGER - EVIDENCE, NOT PROMISES
        </div>
      </div>
    ),
    size
  );
}
