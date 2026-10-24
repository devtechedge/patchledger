import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // NEXT_PUBLIC_SITE_URL is set in production; local dev falls back to localhost
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/r/", "/dashboard", "/p/", "/account", "/api/", "/login", "/signup"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
