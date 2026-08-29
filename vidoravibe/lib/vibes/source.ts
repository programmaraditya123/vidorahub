export type DetectedSource = {
  sourceType: "YouTube" | "Google Cloud Storage" | "VidoraHub";
  message: string;
  normalizedUrl: string;
};

export function detectSource(rawValue: string): DetectedSource | null {
  const value = rawValue.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
      return { sourceType: "YouTube", message: "YouTube video detected", normalizedUrl: value };
    }
    if (host === "storage.googleapis.com" || host.endsWith(".storage.googleapis.com")) {
      return { sourceType: "Google Cloud Storage", message: "Google Cloud video detected", normalizedUrl: value };
    }
    if (host.includes("vidorahub")) {
      return { sourceType: "VidoraHub", message: "VidoraHub video detected", normalizedUrl: value };
    }
    return null;
  } catch {
    return null;
  }
}
