export type DetectedSource = { sourceType: "Google Cloud Storage"; message: string; normalizedUrl: string };
export function detectSource(rawValue: string): DetectedSource | null {
  try {
    const url = new URL(rawValue.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443")) return null;
    if (url.hostname === "storage.googleapis.com" || url.hostname.endsWith(".storage.googleapis.com")) {
      return { sourceType: "Google Cloud Storage", message: "Google Cloud video detected", normalizedUrl: url.href };
    }
  } catch { /* Invalid URL is displayed by the input. */ }
  return null;
}
