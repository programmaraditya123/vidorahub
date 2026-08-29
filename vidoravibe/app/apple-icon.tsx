import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 38,
          background: "#111316",
          color: "white",
          fontFamily: "Arial",
          fontSize: 92,
          fontWeight: 900,
        }}
      >
        V
      </div>
    ),
    size,
  );
}
