import { absoluteUrl } from "@/config/seo";

export function GET() {
  return new Response(
    `# VidoraVibe

VidoraVibe is an AI-powered video repurposing platform from the VidoraHub ecosystem.

VidoraVibe turns long-form videos into meaningful short-form Vibes. It supports YouTube, VidoraHub, Google Cloud Storage, and supported direct video URLs.

VidoraVibe analyzes content context to find meaningful moments such as strong hooks, valuable insights, key lessons, funny moments, emotional moments, smart discussions, complete stories, and surprising moments.

Create Vibes: ${absoluteUrl("/vibes/create")}
Homepage: ${absoluteUrl("/")}
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
