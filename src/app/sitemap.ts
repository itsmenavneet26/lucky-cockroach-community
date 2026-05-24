import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/explore",
    "/volunteer",
    "/about",
    "/guidelines",
    "/leaderboard",
    "/mental-health",
    "/scholarship",
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
  }));

  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const service = createServiceClient();
    const { data: topics } = await service
      .from("topics")
      .select("slug")
      .eq("is_archived", false);
    const { data: posts } = await service
      .from("posts")
      .select("id, created_at")
      .eq("is_removed", false)
      .order("created_at", { ascending: false })
      .limit(500);
    dynamic = [
      ...(topics ?? []).map((t) => ({
        url: `${SITE}/t/${t.slug}`,
        lastModified: new Date(),
      })),
      ...(posts ?? []).map((p) => ({
        url: `${SITE}/post/${p.id}`,
        lastModified: new Date(p.created_at),
      })),
    ];
  } catch {
    // Database unavailable at build time — ship the static routes only.
  }

  return [...staticRoutes, ...dynamic];
}
