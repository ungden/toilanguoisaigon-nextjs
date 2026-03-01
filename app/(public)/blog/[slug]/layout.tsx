import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Script from "next/script";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image_url, created_at, updated_at, meta_title, meta_description, tags, published_at, profiles!fk_posts_author_profile(full_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  const seoTitle = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt?.slice(0, 160) || `Đọc bài viết "${post.title}" trên Tôi là người Sài Gòn.`;
  const authorName = (post.profiles as unknown as { full_name: string | null } | null)?.full_name || "Tôi là người Sài Gòn";
  const canonicalUrl = `https://www.toilanguoisaigon.com/blog/${slug}`;
  const publishedTime = post.published_at || post.created_at;
  const modifiedTime = post.updated_at || publishedTime;
  const tags = (post.tags as string[] | null) || [];

  return {
    title: seoTitle,
    description,
    authors: [{ name: authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description,
      type: "article",
      url: canonicalUrl,
      publishedTime,
      modifiedTime,
      authors: [authorName],
      tags,
      images: post.cover_image_url
        ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogPostLayout({ params, children }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image_url, created_at, updated_at, published_at, profiles!fk_posts_author_profile(full_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  // JSON-LD Article structured data
  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt || undefined,
        image: post.cover_image_url || undefined,
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at || post.published_at || post.created_at,
        author: {
          "@type": "Person",
          name: (post.profiles as unknown as { full_name: string | null } | null)?.full_name || "Tôi là người Sài Gòn",
        },
        publisher: {
          "@type": "Organization",
          name: "Tôi là người Sài Gòn",
          url: "https://www.toilanguoisaigon.com",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://www.toilanguoisaigon.com/blog/${slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="article-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
