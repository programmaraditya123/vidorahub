import { absoluteUrl } from "@/config/seo";

const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VidoraVibe",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/"),
  description:
    "VidoraVibe uses AI to find meaningful moments in long-form videos and turn them into engaging short-form Vibes.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI-powered video analysis",
    "YouTube video source support",
    "VidoraHub video source support",
    "Google Cloud Storage video source support",
    "Short-form Vibe creation",
    "Vibe preview and download",
  ],
};

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to create Vibes with VidoraVibe",
  description: "Create short-form Vibes from a supported long-form video URL.",
  step: [
    {
      "@type": "HowToStep",
      name: "Add your video",
      text: "Paste a supported YouTube, VidoraHub, Google Cloud Storage, or direct video URL.",
    },
    {
      "@type": "HowToStep",
      name: "Analyze the content",
      text: "VidoraVibe processes the video, extracts audio, transcribes it, and analyzes context.",
    },
    {
      "@type": "HowToStep",
      name: "Find meaningful moments",
      text: "VidoraVibe identifies engaging and context-complete moments.",
    },
    {
      "@type": "HowToStep",
      name: "Create and export Vibes",
      text: "Preview and download the generated short-form Vibes.",
    },
  ],
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is VidoraVibe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VidoraVibe is an AI-powered video repurposing platform that turns long-form videos into meaningful short-form Vibes.",
      },
    },
    {
      "@type": "Question",
      name: "What sources does VidoraVibe support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VidoraVibe supports YouTube, VidoraHub, Google Cloud Storage, and supported direct video URLs.",
      },
    },
    {
      "@type": "Question",
      name: "Does VidoraVibe create random clips?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. VidoraVibe analyzes context and looks for meaningful moments such as hooks, insights, lessons, stories, and strong discussions.",
      },
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify([softwareApplication, howTo, faq]) }}
    />
  );
}
