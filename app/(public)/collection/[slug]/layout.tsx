import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("title, description, cover_image_url, collection_categories(name)")
    .ilike("slug", slug)
    .single();

  if (!collection) {
    return {
      title: "Không tìm thấy bộ sưu tập",
    };
  }

  const description =
    collection.description?.slice(0, 160) ||
    `Khám phá bộ sưu tập "${collection.title}" - Những địa điểm ẩm thực tuyệt vời nhất Sài Gòn.`;

  return {
    title: `${collection.title} - Bộ sưu tập`,
    description,
    openGraph: {
      title: `${collection.title} | Tôi là người Sài Gòn`,
      description,
      type: "article",
      images: collection.cover_image_url
        ? [{ url: collection.cover_image_url, width: 1200, height: 630, alt: collection.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: collection.title,
      description,
      images: collection.cover_image_url ? [collection.cover_image_url] : undefined,
    },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
