import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/src/hooks/ui/ToastProvider/ToastProvider";
import ReduxProvider from "@/src/redux/provider";
import SpeedInsightsClient from "./SpeedInsightsClient";


export const metadata: Metadata = {
  title: "VidoraHub",
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
        <ToastProvider>{children}<SpeedInsightsClient/></ToastProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
