import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/events", "/calendar"],
        disallow: [
          "/admin",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/auth/",
          "/registrations",
          "/bookmarks",
          "/notifications",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
