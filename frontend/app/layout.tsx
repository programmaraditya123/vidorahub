import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/src/hooks/ui/ToastProvider/ToastProvider";
import ReduxProvider from "@/src/redux/provider";
import SpeedInsightsClient from "./SpeedInsightsClient";


export const metadata : Metadata= {
  title: {
    default: "VidoraHub – The Future of Video Sharing",
    template: "%s | VidoraHub"
  },
  description:
    "VidoraHub is a modern video sharing platform to watch, upload and discover powerful videos from creators worldwide.",

  openGraph: {
    siteName: "VidoraHub",
    type: "website",
    images: ["/og-image.png"]
  },

  twitter: {
    card: "summary_large_image"
  },

  robots: {
    index: true,
    follow: true
  }
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
