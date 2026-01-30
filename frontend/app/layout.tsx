import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/src/hooks/ui/ToastProvider/ToastProvider";
import ReduxProvider from "@/src/redux/provider";
import SpeedInsightsClient from "./SpeedInsightsClient";


export const metadata: Metadata = {
  metadataBase: new URL("https://www.vidorahub.com"),

  title: "VidoraHub – Discover, Watch & Share Videos That Matter",
  description:
    "VidoraHub is a next-generation video sharing platform to watch, upload and discover trending videos, original creators and powerful stories.",

  openGraph: {
    title: "VidoraHub – Discover, Watch & Share Videos That Matter",
    description:
      "A modern video sharing platform built for creators and viewers.",
    url: "https://www.vidorahub.com",
    siteName: "VidoraHub",
    images: [
      {
        url: "/og-image.png",    
        width: 1200,
        height: 630,
        alt: "VidoraHub Video Sharing Platform",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
        <ToastProvider>
          {children}
          <SpeedInsightsClient/>
          </ToastProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
