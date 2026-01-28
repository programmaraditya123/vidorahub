import React from "react";

export const metadata = {
  title: {
    default: "Vibes – Short Videos & Reels on VidoraHub",
    template: "%s | Vibes – VidoraHub"
  },
  description:
    "Explore Vibes on VidoraHub – a new way to watch short videos, viral clips, creative reels and trending moments from creators around the world.",

  keywords: [
    "short videos",
    "reels",
    "viral videos",
    "trending shorts",
    "Vibes videos",
    "VidoraHub Vibes",
    "watch short videos",
    "creator reels platform"
  ],

  openGraph: {
    title: "Vibes – Short Videos & Reels on VidoraHub",
    description:
      "Watch endless short videos, viral reels and trending clips on Vibes by VidoraHub. Built for creators and viewers.",
    url: "https://vidorahub.com/vibes",
    siteName: "VidoraHub",
    images: [
      {
        url: "https://vidorahub.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "VidoraHub Vibes – Short Videos Platform"
      }
    ],
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Vibes – Short Videos on VidoraHub",
    description:
      "Discover viral short videos and trending reels on Vibes, VidoraHub’s short-form video experience.",
    images: ["https://vidorahub.com/og-image.png"]
  },

  robots: {
    index: true,
    follow: true
  }
};

export default function vibesLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
