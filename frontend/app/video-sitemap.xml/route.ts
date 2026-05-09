import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 3600;


type SitemapVideo = {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  updatedAt?: string;
  duration?: number;
};


const SITEMAP_API_URL = process.env.API_BASE_URL_RENDER
  ? `${process.env.API_BASE_URL_RENDER}/api/v1/getsitemap`
  : "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/getsitemap";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET() {
  let videos: SitemapVideo[] = [];

  try {
    const res = await fetch(SITEMAP_API_URL, {
      next: { revalidate: 3600 },
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || !contentType.includes("application/json")) {
      console.error(
        `Video sitemap API error ${res.status}:`,
        await res.text()
      );

      return new NextResponse("Failed", { status: 500 });
    }

    const data = await res.json();

    videos = data.videos ?? [];
  } catch (err) {
    console.error("Video sitemap fetch failed:", err);

    return new NextResponse("Failed", { status: 500 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
${videos
  .filter((video) => video.videoUrl)
  .map((video) => {
    const pageUrl = `https://www.vidorahub.com/video/${video._id}`;

    return `
  <url>
    <loc>${pageUrl}</loc>

    <video:video>
      <video:title>
        ${escapeXml(video.title || "VidoraHub Video")}
      </video:title>

      <video:description>
        ${escapeXml(
          video.description || "Watch videos on VidoraHub"
        )}
      </video:description>

      ${
        video.thumbnailUrl
          ? `
      <video:thumbnail_loc>
        ${escapeXml(video.thumbnailUrl)}
      </video:thumbnail_loc>
      `
          : ""
      }

      <video:content_loc>
        ${escapeXml(video.videoUrl!)}
      </video:content_loc>

      ${
        video.duration
          ? `
      <video:duration>${video.duration}</video:duration>
      `
          : ""
      }

      <video:publication_date>
        ${new Date(
          video.updatedAt || Date.now()
        ).toISOString()}
      </video:publication_date>

    </video:video>
  </url>
`;
  })
  .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}