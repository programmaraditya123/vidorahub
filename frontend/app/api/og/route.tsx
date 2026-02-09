import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "VidoraHub";
  const thumb = searchParams.get("thumb");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0c",
          color: "white",
        }}
      >
        {thumb && (
          <img
            src={thumb}
            style={{ width: "55%", objectFit: "cover" }}
          />
        )}

        <div
          style={{
            flex: 1,
            padding: 60,
            display: "flex",
            alignItems: "center",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
