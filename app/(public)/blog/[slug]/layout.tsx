import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image_url, created_at, profiles:author_id(full_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  const description = post.excerpt?.slice(0, 160) || `Đọc bài viết "${post.title}" trên Tôi là người Sài Gòn.`;
  const authorName = (post.profiles as unknown as { full_name: string | null } | null)?.full_name || "Tôi là người Sài Gòn";

  return {
    title: post.title,
    description,
    authors: [{ name: authorName }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.created_at,
      authors: [authorName],
      images: post.cover_image_url
        ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
