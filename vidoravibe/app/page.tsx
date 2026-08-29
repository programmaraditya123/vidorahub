import type { Metadata } from "next";

import { HomePage } from "@/components/homepage/HomePage";
import { absoluteUrl, homeDescription, seoKeywords, siteUrl } from "@/config/seo";

export const metadata: Metadata = {
  title: "VidoraVibe - Turn Long Videos Into Meaningful Vibes",
  description: homeDescription,
  keywords: seoKeywords,
  authors: [{ name: "VidoraHub" }],
  creator: "VidoraHub",
  publisher: "VidoraHub",
  category: "AI video software",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "VidoraVibe - Turn Long Videos Into Meaningful Vibes",
    description: homeDescription,
    url: siteUrl,
    siteName: "VidoraVibe",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "VidoraVibe turns long videos into meaningful Vibes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VidoraVibe - Turn Long Videos Into Meaningful Vibes",
    description: homeDescription,
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function Home() {
  return <HomePage />;
}
