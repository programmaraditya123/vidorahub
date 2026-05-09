import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",

        allow: [
          "/",
          "/video/",
          "/channel/",
          "/profile/",
          "/search",
          "/vibes",
          "/earn",
        ],

        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/upload",
          "/settings",
          "/dashboard",
          "/studio",
          "/admin",
          "/private",
          "/_next/",
          "/temp/",
          "/*.json$",
          "/*?*session*",
          "/*?*token*",
          "/*?*auth*",
        ],
      },

      // Block bad AI scrapers if you want
      {
        userAgent: "GPTBot",
        disallow: "/",
      },

      {
        userAgent: "CCBot",
        disallow: "/",
      },

      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
    ],

    sitemap: [
      "https://www.vidorahub.com/sitemap.xml",
      "https://www.vidorahub.com/video-sitemap.xml",
    ],

    host: "https://www.vidorahub.com",
  };
}