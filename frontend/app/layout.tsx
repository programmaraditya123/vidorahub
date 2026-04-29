import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/src/hooks/ui/ToastProvider/ToastProvider";
import ReduxProvider from "@/src/redux/provider";
import SpeedInsightsClient from "./SpeedInsightsClient";
import WelcomeModal from "@/src/components/shared/WelcomeModal/WelcomeModal";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vidorahub.com"),

  title: "VidoraHub – Discover, Watch & Share Videos That Matter",
  description: "VidoraHub is a next-generation video sharing platform.",

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "VidoraHub",
    description: "Modern video sharing platform",
    url: "https://www.vidorahub.com",
    siteName: "VidoraHub",
    images: ["https://www.vidorahub.com/og-image.png"],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    images: ["https://www.vidorahub.com/og-image.png"],
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
        <div id="portal-root"></div>
        <div className="app-container">
          <ReduxProvider>
            <ToastProvider>
              <WelcomeModal />
              <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
                {children}
              </GoogleOAuthProvider>
              <SpeedInsightsClient />
            </ToastProvider>
          </ReduxProvider>
        </div>
      </body>
    </html>
  );
}
