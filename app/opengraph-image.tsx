import { ImageResponse } from "next/og";

export const alt = "PatchLedger - prove your security maintenance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#0c0f14",
          color: "#e8ecf2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              border: "5px solid #f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 22, height: 22, background: "#f59e0b" }} />
          </div>
          <div style={{ fontSize: 40, letterSpacing: 12, fontWeight: 700 }}>PATCHLEDGER</div>
        </div>
        <div style={{ marginTop: 48, width: 140, height: 4, background: "#f59e0b" }} />
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          Prove your security maintenance.
        </div>
        <div style={{ marginTop: 12, fontSize: 64, fontWeight: 700, color: "#f59e0b" }}>
          Evidence, not promises.
        </div>
        <div style={{ marginTop: 36, fontSize: 28, color: "#9aa6b6" }}>
          Scanner output in. An evidence-backed record out.
        </div>
      </div>
    ),
    size
  );
}
