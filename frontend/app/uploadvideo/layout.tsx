import Navbar2 from "@/src/components/Navbar2/Navbar2";
import React from "react";

export const metadata = {
  title: {
    default: "Upload Videos – Creator Studio | VidoraHub",
    template: "%s | Upload – VidoraHub"
  },
  description:
    "Upload and publish your videos on VidoraHub. A powerful creator studio to share content, grow your audience and build your channel on a next-generation video platform.",

  keywords: [
    "upload videos",
    "creator studio",
    "video upload platform",
    "publish videos online",
    "creator dashboard",
    "VidoraHub upload",
    "share videos",
    "content creator platform"
  ],

  openGraph: {
    title: "Upload Videos – Creator Studio | VidoraHub",
    description:
      "Creators can upload and publish videos easily on VidoraHub. Build your audience and grow your channel with powerful creator tools.",
    url: "https://vidorahub.com/upload",
    siteName: "VidoraHub",
    images: [
      {
        url: "https://vidorahub.com/og-upload.png",
        width: 1200,
        height: 630,
        alt: "VidoraHub Creator Studio – Upload Videos"
      }
    ],
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Upload Videos – Creator Studio | VidoraHub",
    description:
      "Upload your videos, reach viewers and grow your channel with VidoraHub’s creator studio.",
    images: ["https://vidorahub.com/og-upload.png"]
  },

  robots: {
    index: true,
    follow: true
  }
};

export default function VideoPage({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar2 />
      {children}
    </>
  );
}
