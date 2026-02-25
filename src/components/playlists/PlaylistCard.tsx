import Link from "next/link";
import Image from "next/image";
import { Playlist } from "@/types/database";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface PlaylistCardProps {
  playlist: Playlist;
  variant?: "default" | "compact";
}

export function PlaylistCard({ playlist, variant = "default" }: PlaylistCardProps) {
  const formattedDate = new Date(playlist.generated_date).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
  });

  if (variant === "compact") {
    return (
      <Link
        href={`/playlist/${playlist.slug}`}
        className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-vietnam-red-300 hover:shadow-md"
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={playlist.cover_image_url || FALLBACK_IMAGES.collection}
            alt={playlist.title}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="56px"
          />
          {playlist.emoji && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-2xl">
              {playlist.emoji}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate group-hover:text-vietnam-red-600 transition-colors">
            {playlist.title}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {playlist.location_count} địa điểm
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/playlist/${playlist.slug}`}
      className="group block overflow-hidden rounded-xl border transition-all hover:border-vietnam-red-300 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={playlist.cover_image_url || FALLBACK_IMAGES.collection}
          alt={playlist.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Emoji overlay */}
        {playlist.emoji && (
          <div className="absolute top-3 left-3 text-3xl drop-shadow-lg">
            {playlist.emoji}
          </div>
        )}

        {/* Mood badge */}
        {playlist.mood && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 bg-white/90 text-xs backdrop-blur-sm"
          >
            {MOOD_LABELS[playlist.mood] || playlist.mood}
          </Badge>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg leading-tight drop-shadow-md">
            {playlist.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {playlist.location_count} địa điểm
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {playlist.description && (
        <div className="p-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {playlist.description}
          </p>
        </div>
      )}
    </Link>
  );
}
