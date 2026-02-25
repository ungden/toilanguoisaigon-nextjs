"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePlaylistDetail } from "@/hooks/data/usePlaylistDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ListMusic,
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { FALLBACK_IMAGES } from "@/utils/constants";

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
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-[21/9] w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ListMusic className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy playlist</h1>
        <p className="text-muted-foreground mb-6">
          Playlist này không tồn tại hoặc đã bị xóa.
        </p>
        <Button asChild>
          <Link href="/playlists">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Xem tất cả playlist
          </Link>
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(playlist.generated_date).toLocaleDateString(
    "vi-VN",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/playlists"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả playlist
      </Link>

      {/* Hero */}
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl mb-8">
        <Image
          src={playlist.cover_image_url || FALLBACK_IMAGES.collectionHero}
          alt={playlist.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            {playlist.emoji && (
              <span className="text-4xl drop-shadow-lg">{playlist.emoji}</span>
            )}
            {playlist.mood && (
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-white/30">
                {MOOD_LABELS[playlist.mood] || playlist.mood}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-lg">
            {playlist.title}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {playlist.location_count} địa điểm
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formattedDate}
            </span>
          </div>
          {playlist.description && (
            <p className="mt-3 text-white/90 max-w-2xl text-sm sm:text-base">
              {playlist.description}
            </p>
          )}
        </div>
      </div>

      {/* Location list - numbered like a playlist track list */}
      <div className="space-y-3">
        {playlist.playlist_locations?.map((pl, index) => {
          const loc = pl.locations;
          if (!loc) return null;

          return (
            <Link
              key={`${pl.playlist_id}-${pl.location_id}`}
              href={`/place/${loc.slug}`}
              className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-vietnam-red-300 hover:shadow-md hover:bg-accent/30"
            >
              {/* Track number */}
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-lg font-bold text-muted-foreground group-hover:text-vietnam-red-600 transition-colors">
                  {index + 1}
                </span>
              </div>

              {/* Image */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={loc.main_image_url || FALLBACK_IMAGES.location}
                  alt={loc.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                  sizes="64px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-vietnam-red-600 transition-colors">
                  {loc.name}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {loc.address}
                </p>
                {pl.ai_note && (
                  <p className="text-xs text-vietnam-gold-600 dark:text-vietnam-gold-400 mt-0.5 italic line-clamp-1">
                    {pl.ai_note}
                  </p>
                )}
              </div>

              {/* Right side info */}
              <div className="flex-shrink-0 flex items-center gap-3 text-sm text-muted-foreground">
                {loc.price_range && (
                  <span className="flex items-center gap-0.5">
                    <DollarSign className="h-3 w-3" />
                    {loc.price_range}
                  </span>
                )}
                {loc.average_rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-vietnam-gold-500 text-vietnam-gold-500" />
                    {loc.average_rating.toFixed(1)}
                  </span>
                )}
                {loc.review_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="h-3 w-3" />
                    {loc.review_count}
                  </span>
                )}
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                  {loc.district}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty locations */}
      {(!playlist.playlist_locations || playlist.playlist_locations.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Playlist này chưa có địa điểm nào.</p>
        </div>
      )}
    </div>
  );
}
