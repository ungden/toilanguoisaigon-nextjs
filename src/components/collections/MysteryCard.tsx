"use client";

import { Location } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { getPathFromSupabaseUrl, getTransformedImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { getCategoryArtwork, BRAND_ASSETS } from '@/utils/constants';
import { formatPriceRange } from '@/utils/formatters';
import { ArrowRight, Star, DollarSign, MapPin, MessageSquare, Sparkles } from 'lucide-react';

interface MysteryCardProps {
  location: Location | null;
  isRevealed: boolean;
  isFlippable: boolean;
  onReveal: () => void;
}

export function MysteryCard({ location, isRevealed, isFlippable, onReveal }: MysteryCardProps) {
  const imagePath = location?.main_image_url ? getPathFromSupabaseUrl(location.main_image_url) : null;
  const optimizedImageUrl = imagePath
    ? getTransformedImageUrl(imagePath, { width: 400, height: 300 })
    : getCategoryArtwork(location?.name || '');

  const handleCardClick = () => {
    if (isFlippable && !isRevealed) {
      onReveal();
    }
  };

  // Pick the best rating source
  const rating = location?.average_rating && location.average_rating > 0
    ? location.average_rating
    : location?.google_rating;
  const reviewCount = location?.review_count && location.review_count > 0
    ? location.review_count
    : location?.google_review_count;

  // Get first highlight or review summary snippet
  const highlight = location?.google_highlights?.[0]
    || (location?.google_review_summary
      ? (location.google_review_summary.length > 60
        ? location.google_review_summary.slice(0, 60) + '…'
        : location.google_review_summary)
      : null);

  // Category name
  const categoryName = location?.location_categories?.[0]?.categories?.name;

  return (
    <div className="perspective-1000 h-[22rem] w-full">
      <div
        className={cn(
          'relative w-full h-full transform-style-3d transition-transform duration-700',
          { 'rotate-y-180': isRevealed }
        )}
        onClick={handleCardClick}
      >
        {/* Card Back (Hidden) — Saigon-themed tarot artwork */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className={cn(
            "w-full h-full overflow-hidden border-2 border-vietnam-gold-400 relative group",
            isFlippable ? "cursor-pointer hover:border-vietnam-red-400 hover:shadow-lg transition-all" : "opacity-60 cursor-not-allowed"
          )}>
            <Image
              src={BRAND_ASSETS.mysteryCardBack}
              alt="Lá bài bí ẩn"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col items-center justify-end p-4 text-center">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Địa điểm bí ẩn</h3>
              <p className="text-vietnam-gold-200 text-sm drop-shadow">Nhấp để khám phá!</p>
            </div>
          </Card>
        </div>

        {/* Card Front (Revealed) — Rich info */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          {location && (
            <Card className="w-full h-full overflow-hidden flex flex-col border-2 border-vietnam-red-200 shadow-md">
              {/* Image section */}
              <div className="relative h-36 flex-shrink-0">
                <Image
                  src={optimizedImageUrl}
                  alt={location.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Rating badge overlay */}
                {rating && rating > 0 && (
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 shadow-sm">
                    <Star className="h-3.5 w-3.5 fill-vietnam-gold-500 text-vietnam-gold-500" />
                    <span className="text-sm font-bold text-vietnam-blue-800">{rating.toFixed(1)}</span>
                    {reviewCount && reviewCount > 0 && (
                      <span className="text-[10px] text-slate-500">({reviewCount})</span>
                    )}
                  </div>
                )}

                {/* Category badge */}
                {categoryName && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-vietnam-red-600 text-white text-[10px] px-1.5 py-0.5 shadow-sm">
                      {categoryName}
                    </Badge>
                  </div>
                )}

                {/* Name overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-base text-white drop-shadow-md line-clamp-1">{location.name}</h3>
                  <div className="flex items-center gap-1 text-white/90 text-xs">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">{location.district}</span>
                  </div>
                </div>
              </div>

              {/* Info section */}
              <CardContent className="p-3 flex flex-col justify-between flex-grow gap-2">
                {/* Price + review count */}
                <div className="flex items-center justify-between text-xs">
                  {location.price_range && (
                    <div className="flex items-center gap-1 text-vietnam-blue-700">
                      <DollarSign className="h-3 w-3 text-vietnam-gold-600" />
                      <span className="font-medium">{formatPriceRange(location.price_range)}</span>
                    </div>
                  )}
                  {!location.price_range && reviewCount && reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <MessageSquare className="h-3 w-3" />
                      <span>{reviewCount} đánh giá</span>
                    </div>
                  )}
                </div>

                {/* Highlight / review snippet */}
                {highlight && (
                  <div className="flex items-start gap-1.5 bg-vietnam-gold-50 rounded-md px-2 py-1.5 border border-vietnam-gold-200">
                    <Sparkles className="h-3 w-3 text-vietnam-gold-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-vietnam-blue-700 line-clamp-2 italic">
                      &ldquo;{highlight}&rdquo;
                    </p>
                  </div>
                )}

                {/* No highlight — show description snippet instead */}
                {!highlight && location.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {location.description.length > 80
                      ? location.description.slice(0, 80) + '…'
                      : location.description}
                  </p>
                )}

                <Button asChild size="sm" className="w-full mt-auto btn-vietnam">
                  <Link href={`/place/${location.slug}`}>
                    Khám phá ngay <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
