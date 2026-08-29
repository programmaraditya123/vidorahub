import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VidoraVibe",
    short_name: "VidoraVibe",
    description: "Turn long videos into meaningful Vibes with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#0f766e",
    icons: [
      {
        src: absoluteUrl("/icon"),
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: absoluteUrl("/apple-icon"),
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
