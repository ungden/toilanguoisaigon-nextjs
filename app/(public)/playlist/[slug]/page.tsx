"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePlaylistDetail } from "@/hooks/data/usePlaylistDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { FALLBACK_IMAGES, getCategoryArtwork } from "@/utils/constants";
import { formatPriceRange } from "@/utils/formatters";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";

const MOOD_LABELS: Record<string, string> = {
  morning: "Buổi sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
  "late-night": "Đêm khuya",
  "rainy-day": "Ngày mưa",
  weekend: "Cuối tuần",
  "date-night": "Hẹn hò",
  family: "Gia đình",
  budget: "Tiết kiệm",
  premium: "Sang chảnh",
  adventure: "Khám phá",
  comfort: "Comfort food",
  healthy: "Healthy",
  "street-food": "Đường phố",
  seasonal: "Theo mùa",
};

export default function PlaylistDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: playlist, isLoading, error } = usePlaylistDetail(slug);

  if (isLoading) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy bộ sưu tập</h1>
          <p className="text-vietnam-blue-600">Bộ sưu tập bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <Link href="/collections" className="text-vietnam-red-600 hover:underline mt-4 inline-block">
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Quay lại danh sách bộ sưu tập
          </Link>
        </div>
      </div>
    );
  }

  const locations = playlist.collection_locations
    ?.filter((cl) => cl.locations != null)
    .map((cl) => ({ ...cl.locations, ai_note: cl.ai_note, position: cl.position })) || [];

  const formattedDate = new Date(playlist.generated_date).toLocaleDateString(
    "vi-VN",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section - matches collection detail style */}
      <section className="relative py-16 bg-vietnam-red-600 overflow-hidden">
        <Image
          src={playlist.cover_image_url || FALLBACK_IMAGES.collectionHero}
          alt={playlist.title}
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              {playlist.emoji && (
                <span className="text-4xl drop-shadow-lg">{playlist.emoji}</span>
              )}
              {playlist.mood && (
                <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                  {MOOD_LABELS[playlist.mood] || playlist.mood}
                </Badge>
              )}
              <Badge className="bg-vietnam-gold-500 text-white border-none">
                <Sparkles className="h-3 w-3 mr-1" />
                AI gợi ý
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {playlist.title}
            </h1>
            {playlist.description && (
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                {playlist.description}
              </p>
            )}
            <div className="mt-8 flex items-center justify-center gap-6 text-white/80">
              <span className="text-vietnam-gold-400 font-semibold">
                {locations.length} địa điểm được AI tuyển chọn
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Grid - matches collection detail style */}
      <section className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((location, index) => {
            const imagePath = location.main_image_url ? getPathFromSupabaseUrl(location.main_image_url) : null;
            const optimizedImageUrl = imagePath
              ? getTransformedImageUrl(imagePath, { width: 400, height: 300 })
              : getCategoryArtwork(location.name);

            return (
              <Link href={`/place/${location.slug}`} key={location.id || index} className="block group">
                <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full bg-white">
                  <div className="relative overflow-hidden aspect-[4/3] w-full">
                    <Image
                      src={optimizedImageUrl}
                      alt={location.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-vietnam-red-600 text-white font-bold">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-vietnam-red-600 text-white">
                        {formatPriceRange(location.price_range)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors mb-2">
                      {location.name}
                    </h3>

                    <div className="space-y-2 text-sm text-vietnam-blue-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{location.district}</span>
                      </div>

                      {location.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 opacity-0" />
                          <span className="text-xs text-muted-foreground truncate">{location.address}</span>
                        </div>
                      )}
                    </div>

                    {location.average_rating > 0 && (
                      <div className="flex items-center mb-3">
                        <Star className="h-4 w-4 text-vietnam-gold-500 fill-vietnam-gold-500 mr-1" />
                        <span className="text-sm font-medium text-vietnam-blue-700">
                          {location.average_rating.toFixed(1)} ({location.review_count} đánh giá)
                        </span>
                      </div>
                    )}

                    {/* AI note - unique to playlist items */}
                    {location.ai_note && (
                      <div className="mt-3 p-2 rounded-md bg-vietnam-gold-50 dark:bg-vietnam-gold-950/20 border border-vietnam-gold-200 dark:border-vietnam-gold-800">
                        <p className="text-xs text-vietnam-gold-700 dark:text-vietnam-gold-400 italic flex items-start gap-1">
                          <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {location.ai_note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-vietnam-blue-800 mb-2">
              Chưa có địa điểm nào
            </h3>
            <p className="text-vietnam-blue-600">
              Bộ sưu tập này đang được cập nhật thêm địa điểm mới.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
