import { ImageResponse } from "next/og";

export const alt = "Create short-form Vibes with VidoraVibe";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#111316",
        color: "white",
        fontFamily: "Arial",
        padding: 64,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900 }}>VidoraVibe</div>
          <div style={{ display: "flex", color: "#5eead4", fontSize: 24, fontWeight: 800 }}>Create Vibes</div>
        </div>
        <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 690 }}>
            <div style={{ display: "flex", fontSize: 84, lineHeight: 0.96, fontWeight: 900, letterSpacing: 0 }}>
              Paste a video URL. Create meaningful Vibes.
            </div>
            <div style={{ display: "flex", color: "#d4d4d8", fontSize: 30, lineHeight: 1.35 }}>
              Start from YouTube, VidoraHub, Google Cloud Storage, or a supported direct video link.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 330 }}>
            {["Validate source", "Understand context", "Find moments", "Generate Vibes"].map((label, index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  border: "1px solid rgba(94,234,212,0.35)",
                  borderRadius: 16,
                  padding: 18,
                  background: "rgba(20,184,166,0.14)",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                <span style={{ display: "flex", color: "#5eead4" }}>{String(index + 1).padStart(2, "0")}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", color: "#fbbf24", fontSize: 26, fontWeight: 900 }}>Your next great short might already be inside your longest video.</div>
      </div>
      </div>
    ),
    size,
  );
}
