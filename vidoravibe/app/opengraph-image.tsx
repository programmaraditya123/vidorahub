import { ImageResponse } from "next/og";

export const alt = "VidoraVibe turns long videos into meaningful Vibes";
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
        background: "#f7f8f6",
        color: "#111827",
        fontFamily: "Arial",
        padding: 64,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900 }}>VidoraVibe</div>
          <div style={{ display: "flex", color: "#0f766e", fontSize: 24, fontWeight: 800 }}>AI video repurposing</div>
        </div>
        <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 650 }}>
            <div style={{ display: "flex", fontSize: 82, lineHeight: 0.96, fontWeight: 900, letterSpacing: 0 }}>
              Turn Long Videos Into Meaningful Vibes.
            </div>
            <div style={{ display: "flex", color: "#52525b", fontSize: 30, lineHeight: 1.35 }}>
              Find the moments that matter in YouTube, VidoraHub, and supported video URLs.
            </div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["Hook", "Insight", "Story"].map((label, index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: 120,
                  height: 250,
                  borderRadius: 18,
                  padding: 18,
                  background: index === 0 ? "#be123c" : index === 1 ? "#0f766e" : "#b45309",
                  color: "white",
                  boxShadow: "0 20px 60px rgba(15,23,42,0.22)",
                }}
              >
                <div style={{ display: "flex", fontSize: 22, fontWeight: 900 }}>{label}</div>
                <div style={{ display: "flex", fontSize: 42, fontWeight: 900 }}>0:{index === 0 ? "34" : index === 1 ? "58" : "41"}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, color: "#0f766e", fontSize: 24, fontWeight: 900 }}>
          <span>YouTube</span>
          <span>VidoraHub</span>
          <span>Video URL</span>
        </div>
      </div>
      </div>
    ),
    size,
  );
}
