import type { Metadata } from "next";
import "./globals.css";

import { siteUrl } from "@/config/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VidoraVibe",
    template: "%s | VidoraVibe",
  },
  description: "Turn long videos into meaningful Vibes.",
  applicationName: "VidoraVibe",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
