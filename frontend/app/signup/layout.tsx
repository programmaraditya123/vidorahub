import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sign Up – Join VidoraHub",
    template: "%s | VidoraHub"
  },
  description:
    "Create your free VidoraHub account to watch, upload and share videos. Join a growing community of creators and viewers on a next-generation video platform.",

  keywords: [
    "sign up",
    "create account",
    "join video platform",
    "register on VidoraHub",
    "video sharing platform signup",
    "creator platform register"
  ],

  openGraph: {
    title: "Sign Up – Join VidoraHub",
    description:
      "Create your VidoraHub account and start watching and sharing videos today. A modern platform for creators and viewers.",
    url: "https://vidorahub.com/signup",
    siteName: "VidoraHub",
    images: [
      {
        url: "https://vidorahub.com/vercel.svg",
        width: 1200,
        height: 630,
        alt: "VidoraHub Signup Page"
      }
    ],
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Sign Up – VidoraHub",
    description:
      "Join VidoraHub to watch videos, upload content and support creators.",
    images: ["https://vidorahub.com/vercel.svg"]
  },

  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
