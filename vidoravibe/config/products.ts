export type VidoraProduct = {
  name: string;
  description: string;
  url?: string;
  cta: string;
  current?: boolean;
};

const vidoraHubUrl = process.env.NEXT_PUBLIC_VIDORAHUB_URL || "";
const vidoraVibeUrl = process.env.NEXT_PUBLIC_VIDORAVIBE_APP_URL || "/";

export const vidoraProducts: VidoraProduct[] = [
  {
    name: "VidoraHub",
    description: "The main video-sharing and discovery platform for creators and viewers.",
    url: vidoraHubUrl,
    cta: "Explore VidoraHub",
  },
  {
    name: "VidoraHub Studio",
    description: "The creator workspace for managing videos, channels, and growth.",
    url: process.env.NEXT_PUBLIC_VIDORAHUB_STUDIO_URL || "https://studio.vidorahub.com",
    cta: "Open Studio",
  },
  {
    name: "VidoraVibe",
    description: "AI-powered video repurposing that turns long-form content into meaningful Vibes.",
    url: vidoraVibeUrl,
    cta: "Create Vibes",
    current: true,
  },
  {
    name: "About VidoraHub",
    description: "Learn about VidoraHub, its vision, ecosystem, and products.",
    url: process.env.NEXT_PUBLIC_VIDORAHUB_ABOUT_URL || "https://about.vidorahub.com",
    cta: "Learn More",
  },
];
