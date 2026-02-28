"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useCollections, useAICollections } from "@/hooks/data/useCollections";
import { FALLBACK_IMAGES, FEATURED_COLLECTIONS } from "@/utils/constants";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { Collection } from "@/types/database";

// Mood → gradient + Vietnamese label
const MOOD_STYLES: Record<string, { gradient: string; label: string }> = {
  morning: { gradient: "from-amber-400 to-orange-500", label: "Buổi sáng" },
  lunch: { gradient: "from-green-400 to-emerald-600", label: "Bữa trưa" },
  dinner: { gradient: "from-rose-500 to-red-700", label: "Bữa tối" },
  "late-night": { gradient: "from-indigo-600 to-purple-900", label: "Đêm khuya" },
  "rainy-day": { gradient: "from-slate-400 to-blue-600", label: "Ngày mưa" },
  weekend: { gradient: "from-cyan-400 to-blue-500", label: "Cuối tuần" },
  "date-night": { gradient: "from-pink-500 to-rose-600", label: "Hẹn hò" },
  family: { gradient: "from-yellow-400 to-orange-500", label: "Gia đình" },
  budget: { gradient: "from-lime-400 to-green-600", label: "Tiết kiệm" },
  premium: { gradient: "from-amber-500 to-yellow-700", label: "Sang chảnh" },
  adventure: { gradient: "from-teal-400 to-emerald-600", label: "Khám phá" },
  comfort: { gradient: "from-orange-300 to-amber-500", label: "Comfort food" },
  healthy: { gradient: "from-green-300 to-teal-500", label: "Healthy" },
  "street-food": { gradient: "from-red-400 to-orange-600", label: "Đường phố" },
  seasonal: { gradient: "from-violet-400 to-purple-600", label: "Theo mùa" },
};

const DEFAULT_MOOD_STYLE = { gradient: "from-vietnam-red-500 to-vietnam-red-700", label: "" };

// ─── AI Collection Card ──────────────────────────────────────────────────

function AICollectionCard({ collection }: { collection: Collection }) {
  const moodStyle = MOOD_STYLES[collection.mood || ""] || DEFAULT_MOOD_STYLE;
  const formattedDate = collection.generated_date
    ? new Date(collection.generated_date).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <Link href={`/collection/${collection.slug}`} className="block group">
      <Card className="overflow-hidden card-hover border-vietnam-blue-200 h-full flex flex-col bg-white">
        {/* Gradient + Emoji instead of image */}
        <div className={`relative aspect-[4/3] bg-gradient-to-br ${moodStyle.gradient} flex items-center justify-center overflow-hidden`}>
          <span className="text-6xl md:text-7xl drop-shadow-lg group-hover:scale-125 transition-transform duration-500">
            {collection.emoji || "🍽️"}
          </span>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
          {/* Mood badge */}
          {moodStyle.label && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-white/30 text-xs">
                {moodStyle.label}
              </Badge>
            </div>
          )}
          {/* AI badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-vietnam-gold-500/90 text-white border-none backdrop-blur-sm text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
          {/* Date */}
          {formattedDate && (
            <div className="absolute bottom-3 right-3">
              <span className="text-xs text-white/80 flex items-center gap-1 backdrop-blur-sm bg-black/20 px-2 py-0.5 rounded">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            </div>
          )}
        </div>
        <CardHeader className="bg-white flex-grow py-4">
          <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-base leading-tight">
            {collection.title}
          </CardTitle>
          {collection.description && (
            <CardDescription className="text-vietnam-blue-600 line-clamp-2 text-sm">
              {collection.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

const CollectionsPage = () => {
  const { data: collections, isLoading } = useCollections();
  const { data: aiCollections, isLoading: isLoadingAI } = useAICollections(12);

  // Track collection images that failed to load so we can swap to fallback
  const [failedImages, setFailedImages] = useState<Set<string | number>>(new Set());
  const handleImageError = useCallback((id: string | number) => {
    setFailedImages(prev => { const next = new Set(prev); next.add(id); return next; });
  }, []);

  const featuredTitles = useMemo(() => FEATURED_COLLECTIONS.map(fc => fc.title), []);

  const sortedCollections = useMemo(() => {
    if (!collections) return [];

    const priorityItems: typeof collections = [];
    const otherItems: typeof collections = [];

    for (const collection of collections) {
      if (featuredTitles.includes(collection.title)) {
        priorityItems.push(collection);
      } else {
        otherItems.push(collection);
      }
    }

    priorityItems.sort((a, b) => featuredTitles.indexOf(a.title) - featuredTitles.indexOf(b.title));

    return [...priorityItems, ...otherItems];
  }, [collections, featuredTitles]);

  const SkeletonGrid = ({ count = 8 }: { count?: number }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="bg-vietnam-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Bộ Sưu Tập Đặc Biệt
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Khám phá Sài Gòn qua những góc nhìn độc đáo — những bộ sưu tập được tuyển chọn theo chủ đề và phong cách
          </p>
        </div>
      </section>

      {/* Manual / Curated Collections */}
      <section className="container mx-auto py-16 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-vietnam-blue-800 mb-8">
          Tuyển chọn bởi đội ngũ
        </h2>

        {isLoading ? (
          <SkeletonGrid />
        ) : sortedCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCollections.map((collection) => {
              const imageFailed = failedImages.has(collection.id);
              const imagePath = (!imageFailed && collection.cover_image_url) ? getPathFromSupabaseUrl(collection.cover_image_url) : null;
              const optimizedImageUrl = imagePath
                ? getTransformedImageUrl(imagePath, { width: 400, height: 300 })
                : FALLBACK_IMAGES.collection;
              const finalSrc = FEATURED_COLLECTIONS.find(fc => fc.title === collection.title)?.overrideImage
                ?? optimizedImageUrl;

              const isFeatured = featuredTitles.includes(collection.title);

              return (
                <Link href={`/collection/${collection.slug}`} key={collection.id} className="block group">
                  <Card className="overflow-hidden card-hover border-vietnam-blue-200 h-full flex flex-col bg-white">
                    <div className="relative overflow-hidden aspect-[4/3] w-full">
                      <Image
                        src={finalSrc}
                        alt={collection.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={() => handleImageError(collection.id)}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {isFeatured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-vietnam-gold-500 text-white border-vietnam-gold-600 shadow-lg">
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            Đặc biệt
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="bg-white flex-grow">
                      <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg">
                        {collection.title}
                      </CardTitle>
                      <CardDescription className="text-vietnam-blue-600 line-clamp-2 text-sm">
                        {collection.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-vietnam-blue-600">Chưa có bộ sưu tập nào. Hãy quay lại sau!</p>
          </div>
        )}
      </section>

      {/* AI Collections */}
      {(isLoadingAI || (aiCollections && aiCollections.length > 0)) && (
        <section className="bg-vietnam-blue-50 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="h-6 w-6 text-vietnam-gold-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-vietnam-blue-800">
                AI gợi ý hôm nay
              </h2>
            </div>
            <p className="text-vietnam-blue-600 mb-8 max-w-2xl">
              Mỗi ngày, AI của chúng tôi tạo ra những bộ sưu tập ẩm thực mới dựa trên chủ đề, thời điểm và xu hướng.
            </p>

            {isLoadingAI ? (
              <SkeletonGrid count={4} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {aiCollections?.map((collection) => (
                  <AICollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default CollectionsPage;
