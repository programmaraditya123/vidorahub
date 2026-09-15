This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## FastAPI product catalog

The `/stores` route uses `src/lib/http3.ts` and the typed
`src/lib/storeproducts/storeproducts.ts` module to call `/api/products/find`.
Set `NEXT_PUBLIC_API_BASE_URL_THIRD` to the FastAPI origin (without an API path)
and restart/rebuild Next.js after changing it. The default is
`https://vidorahub.fastapicloud.dev`; for local development use
`http://localhost:8000`.

Search text, minimum/maximum price, minimum rating and price ordering are sent
to the backend. Results use server pagination (20 per page), and the Stores
view groups creators from the current page. It does not represent a complete
store directory or total inventory counts. Missing creator profiles do not
produce broken store links.

FastAPI allows browser GET requests from the production VidoraHub origins and
localhost:3000. For other frontend origins, set the comma-separated
`FRONTEND_ALLOWED_ORIGINS` environment variable on FastAPI and restart it.
The public catalog client does not forward account tokens.
