import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/data";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/events",
    "/calendar",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/events" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/events" ? 0.9 : 0.7,
  }));

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await getEvents();
    eventRoutes = events
      .filter((e) => e.status === "published")
      .slice(0, 500)
      .map((e) => ({
        url: `${siteUrl}/events/${e.id}`,
        lastModified: new Date(e.date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // DB may be unavailable at build time
  }

  return [...staticRoutes, ...eventRoutes];
}
