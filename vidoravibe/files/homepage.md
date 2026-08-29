# VidoraVibe Homepage

## Sections

- Navigation with links to How It Works, Why VidoraVibe, VidoraHub, and the real Vibe creation route.
- Hero explaining that VidoraVibe turns long videos into meaningful short-form Vibes.
- Source support for YouTube, VidoraHub, and supported direct or cloud-hosted video URLs.
- What is VidoraVibe explanatory section.
- Why VidoraVibe problem and solution comparison.
- Meaningful, not random differentiator.
- How VidoraVibe Works five-step timeline.
- Built for Creators audience cards.
- VidoraHub ecosystem product cards.
- Final conversion CTA.
- Footer with centralized product and social rendering.

## Component Architecture

The homepage entry is `app/page.tsx`, which renders `components/homepage/HomePage.tsx`.

The shared product navigation lives in `components/homepage/VidoraVibeNav.tsx` and is used on the homepage and `/vibes/create`.

The existing creation flow remains at `/vibes/create` and is rendered by `components/vibes/CreateVibeWorkspace.tsx`.

## Product Configuration

Products are centralized in `config/products.ts`.

To add a new VidoraHub product, update the centralized product configuration rather than modifying the footer component. The ecosystem section and footer product list render from the same configuration.

## Social Configuration

Social links are centralized in `config/social.ts`.

The footer only renders social profiles when the corresponding public environment variable has a value. This avoids inventing or hardcoding social URLs.

## Environment Variables

Homepage-related public variables:

- `NEXT_PUBLIC_VIDORAVIBE_APP_URL`
- `NEXT_PUBLIC_VIDORAHUB_URL`
- `NEXT_PUBLIC_VIDORAHUB_STUDIO_URL`
- `NEXT_PUBLIC_VIDORAHUB_ABOUT_URL`
- `NEXT_PUBLIC_VIDORAVIBE_INSTAGRAM_URL`
- `NEXT_PUBLIC_VIDORAVIBE_FACEBOOK_URL`
- `NEXT_PUBLIC_VIDORAVIBE_LINKEDIN_URL`

API variables remain documented in `files/api-integration.md`.

## Navigation Routes

- Primary CTA: `/vibes/create`
- Create Vibes: `/vibes/create`
- How It Works: `/#how-it-works`
- Supported Sources: `/#sources`
- Why VidoraVibe: `/#why`
- VidoraHub ecosystem: `/#ecosystem`

## Capability Notes

The homepage avoids claiming that publishing to VidoraHub is fully available. The current product UI has the publish action disabled, so homepage copy emphasizes preview and download, with VidoraHub publishing described cautiously.

## SEO, AEO, and GEO

SEO metadata is configured in `app/page.tsx`, `app/layout.tsx`, and `app/vibes/create/page.tsx`.

Generated social metadata images:

- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`
- `app/vibes/create/opengraph-image.tsx`
- `app/vibes/create/twitter-image.tsx`

Generated app metadata images:

- `app/icon.tsx`
- `app/apple-icon.tsx`
- `app/manifest.ts`

AEO support is provided through JSON-LD structured data in `components/seo/StructuredData.tsx`, including SoftwareApplication, HowTo, and FAQPage schema.

GEO and AI-answer-engine discovery support is provided through `app/llms.txt/route.ts`, with concise product facts and canonical links.

Crawler discovery routes:

- `app/robots.ts`
- `app/sitemap.ts`
