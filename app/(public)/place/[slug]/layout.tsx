import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: place } = await supabase
    .from("locations")
    .select("name, description, district, address, main_image_url, average_rating, review_count")
    .eq("slug", slug)
    .single();

  if (!place) {
    return {
      title: "Không tìm thấy địa điểm",
    };
  }

  const title = `${place.name} - ${place.district}`;
  const description =
    place.description?.slice(0, 160) ||
    `Khám phá ${place.name} tại ${place.address}, ${place.district}. Xem đánh giá, hình ảnh và thông tin chi tiết.`;

  return {
    title,
    description,
    openGraph: {
      title: `${place.name} - ${place.district} | Tôi là người Sài Gòn`,
      description,
      type: "article",
      images: place.main_image_url
        ? [{ url: place.main_image_url, width: 1200, height: 630, alt: place.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${place.name} - ${place.district}`,
      description,
      images: place.main_image_url ? [place.main_image_url] : undefined,
    },
  };
}

export default function PlaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
