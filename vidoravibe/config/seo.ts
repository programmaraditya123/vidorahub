const fallbackAppUrl = "http://localhost:3000";

export const siteUrl = (process.env.NEXT_PUBLIC_VIDORAVIBE_APP_URL || fallbackAppUrl).replace(/\/$/, "");

export const seoKeywords = [
  "VidoraVibe",
  "AI video repurposing",
  "long form video to short clips",
  "short form video generator",
  "YouTube clips",
  "VidoraHub Vibes",
  "video highlights",
  "AI video clipping",
  "creator tools",
  "podcast clips",
  "webinar repurposing",
];

export const homeDescription =
  "VidoraVibe uses AI to find meaningful moments in long-form videos and turn them into engaging short-form Vibes for VidoraHub and beyond.";

export const createDescription =
  "Create short-form Vibes from supported YouTube, VidoraHub, Google Cloud Storage, and direct video URLs with VidoraVibe.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
