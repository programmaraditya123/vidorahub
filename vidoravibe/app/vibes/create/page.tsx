import type { Metadata } from "next";

import { VidoraVibeNav } from "@/components/homepage/VidoraVibeNav";
import { CreateVibeWorkspace } from "@/components/vibes/CreateVibeWorkspace";
import { absoluteUrl, createDescription, seoKeywords } from "@/config/seo";

export const metadata: Metadata = {
  title: "Create Vibes",
  description: createDescription,
  keywords: [...seoKeywords, "create Vibes", "video URL to clips"],
  alternates: {
    canonical: absoluteUrl("/vibes/create"),
  },
  openGraph: {
    title: "Create Vibes with VidoraVibe",
    description: createDescription,
    url: absoluteUrl("/vibes/create"),
    siteName: "VidoraVibe",
    type: "website",
    images: [
      {
        url: absoluteUrl("/vibes/create/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Create short-form Vibes with VidoraVibe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Vibes with VidoraVibe",
    description: createDescription,
    images: [absoluteUrl("/vibes/create/twitter-image")],
  },
};

export default function CreateVibesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-zinc-950">
      <VidoraVibeNav />
      <CreateVibeWorkspace />
    </main>
  );
}
