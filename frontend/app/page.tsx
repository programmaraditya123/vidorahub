import BackgroundLayers from "@/src/components/HomePage/BackgroundLayers/BackgroundLayers";
import Header from "@/src/components/HomePage/Header/Header";
import Masonry from "@/src/components/HomePage/Masonry/Masonry";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import VibeSelector from "@/src/components/HomePage/VibeSelector/VibeSelector";
import './page.module.css'
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VidoraHub – Discover, Watch & Share Videos That Matter",
  description:
    "VidoraHub is a next-generation video sharing platform to watch, upload and discover trending videos, original creators and powerful stories. Join the future of video streaming today.",

  keywords: [
    "video sharing platform",
    "watch videos online",
    "upload videos",
    "indian video platform",
    "creator platform",
    "short videos",
    "entertainment videos",
    "education videos",
    "trending videos",
    "VidoraHub"
  ],

  authors: [{ name: "VidoraHub" }],
  creator: "VidoraHub",

  openGraph: {
    title: "VidoraHub – Discover, Watch & Share Videos That Matter",
    description:
      "A modern video sharing platform built for creators and viewers. Watch trending videos, upload your content and grow your audience on VidoraHub.",
    url: "https://vidorahub.com",
    siteName: "VidoraHub",
    images: [
      {
        url: "https://vidorahub.com/vercel.svg",
        width: 1200,
        height: 630,
        alt: "VidoraHub Video Sharing Platform"
      }
    ],
    locale: "en_US",
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "VidoraHub – The Future of Video Sharing",
    description:
      "Watch, upload and discover meaningful videos on VidoraHub. A powerful platform for creators and viewers.",
    images: ["https://vidorahub.com/vercel.svg"],
    creator: "@vidorahub"
  },

  robots: {
    index: true,
    follow: true
  },

  category: "technology"
};



export default function Home() {
  return (
    <>
      <BackgroundLayers />

      <div className="page-wrapper">
        <div className="sidebar-container">
        <Sidebar />

        </div>

        <main className="main-content">
          <Header />
          <Masonry />
        </main>

        <VibeSelector />
      </div>
    </>
  );
}
