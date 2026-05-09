import { MetadataRoute } from "next";

export const revalidate = 3600;

const BASE_URL = "https://www.vidorahub.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1,
    },

    {
      url: `${BASE_URL}/profile`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/channel`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/earn`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },

    {
      url: `${BASE_URL}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },

    {
      url: `${BASE_URL}/search`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${BASE_URL}/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },

    {
      url: `${BASE_URL}/upload`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/vibes`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}





// import { MetadataRoute } from "next";
// import { encodeFilename } from "@/src/functions";

// type SitemapVideo = {
//   _id: string;
//   title: string;
//   description?: string;
//   videoUrl?: string;
//   updatedAt?: string;
// };

// function buildVideoUrl(videoUrl: string, videoId: string): string | null {
//   const lastPart = videoUrl.split("vidorahub/")[1];
//   if (!lastPart) return null;
//   const encoded = encodeFilename(lastPart + videoId);
//   return `https://www.vidorahub.com/video/${encoded}`;
// }

// export const revalidate = 3600;

// // ✅ No NEXT_PUBLIC_ prefix — this runs server-side only
// const SITEMAP_API_URL = process.env.API_BASE_URL_RENDER
//   ? `${process.env.API_BASE_URL_RENDER}/api/v1/getsitemap`
//   : "https://about-vidorahub-ffmpeg-worker.onrender.com/api/v1/getsitemap"; // hardcoded fallback

// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   let videos: SitemapVideo[] = [];

//   try {
//     const res = await fetch(SITEMAP_API_URL, { next: { revalidate: 3600 } });

//     // ✅ Guard against HTML error pages
//     const contentType = res.headers.get("content-type") || "";
//     if (!res.ok || !contentType.includes("application/json")) {
//       console.error(`Sitemap API error ${res.status}:`, await res.text());
//       return [];
//     }

//     const data = await res.json();
//     videos = data.videos ?? [];
//   } catch (err) {
//     console.error("Sitemap fetch failed:", err);
//   }

//   const videoEntries: MetadataRoute.Sitemap = videos
//     .filter((v) => v.videoUrl)
//     .flatMap((v) => {
//       const url = buildVideoUrl(v.videoUrl!, v._id);
//       if (!url) return [];
//       return [
//         {
//           url,
//           lastModified: v.updatedAt ? new Date(v.updatedAt) : new Date(),
//           changeFrequency: "weekly" as const,
//           priority: 0.8,
//         },
//       ];
//     });

//   return [
//     {
//       url: "https://www.vidorahub.com/",
//       lastModified: new Date(),
//       changeFrequency: "daily",
//       priority: 1,
//     },
//     ...videoEntries,
//   ];
// }