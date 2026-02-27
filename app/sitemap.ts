import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = "https://www.toilanguoisaigon.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic: locations
  const { data: locations } = await supabase
    .from("locations")
    .select("slug, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const locationPages: MetadataRoute.Sitemap = (locations || []).map((loc) => ({
    url: `${baseUrl}/place/${loc.slug}`,
    lastModified: new Date(loc.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: blog posts
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, created_at, updated_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Dynamic: collections
  const { data: collections } = await supabase
    .from("collections")
    .select("slug, created_at")
    .order("created_at", { ascending: false });

  const collectionPages: MetadataRoute.Sitemap = (collections || []).map((col) => ({
    url: `${baseUrl}/collection/${col.slug}`,
    lastModified: new Date(col.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic: playlists (table still exists, merged UI into collections page)
  let playlistPages: MetadataRoute.Sitemap = [];
  try {
    const { data: playlists } = await supabase
      .from("playlists")
      .select("slug, created_at, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    playlistPages = (playlists || []).map((pl) => ({
      url: `${baseUrl}/playlist/${pl.slug}`,
      lastModified: new Date(pl.updated_at || pl.created_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // playlists table may not exist if fully migrated
  }

  return [...staticPages, ...locationPages, ...postPages, ...collectionPages, ...playlistPages];
}
