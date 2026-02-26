import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_CONFIG, FALLBACK_IMAGES } from "@/utils/constants";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: playlist } = await supabase
    .from("playlists")
    .select("title, description, cover_image_url, emoji, mood, generated_date, location_count")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!playlist) {
    return {
      title: "Bộ sưu tập không tìm thấy",
    };
  }

  const title = `${playlist.emoji || ""} ${playlist.title}`.trim();
  const description =
    playlist.description ||
    `Bộ sưu tập ẩm thực ${playlist.title} - ${playlist.location_count} địa điểm được AI gợi ý tại Sài Gòn.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      images: [
        {
          url: playlist.cover_image_url || FALLBACK_IMAGES.og,
          width: 1200,
          height: 630,
        },
      ],
      type: "article",
      siteName: SITE_CONFIG.name,
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      images: [playlist.cover_image_url || FALLBACK_IMAGES.og],
    },
  };
}

export default function PlaylistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
