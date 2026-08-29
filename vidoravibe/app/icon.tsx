import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: "#0f766e",
          color: "white",
          fontFamily: "Arial",
          fontSize: 34,
          fontWeight: 900,
        }}
      >
        V
      </div>
    ),
    size,
  );
}
