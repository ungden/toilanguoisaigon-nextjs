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
import { formatPriceRange, cleanReviewSummary } from '@/utils/formatters';
import { ArrowRight, Star, MapPin, MessageSquare, Clock, Tag } from 'lucide-react';

interface MysteryCardProps {
  location: Location | null;
  isRevealed: boolean;
  isFlippable: boolean;
  onReveal: () => void;
}

/**
 * Translate common English Google highlights to Vietnamese.
 * Keeps Vietnamese highlights as-is.
 */
const HIGHLIGHT_VI: Record<string, string> = {
  'offers takeout': 'Mang về',
  'offers delivery': 'Giao hàng',
  'offers dine-in': 'Ăn tại chỗ',
  'good for children': 'Phù hợp trẻ em',
  'good for groups': 'Đi nhóm',
  'has restroom': 'Có WC',
  'free parking lot': 'Đậu xe miễn phí',
  'free street parking': 'Đậu xe đường',
  'outdoor seating': 'Chỗ ngồi ngoài trời',
  'takes reservations': 'Đặt bàn',
  'cash only': 'Chỉ tiền mặt',
  'serves dinner': 'Phục vụ tối',
  'serves lunch': 'Phục vụ trưa',
  'serves breakfast': 'Phục vụ sáng',
  'restaurant': 'Nhà hàng',
  'specialty coffee': 'Cà phê đặc biệt',
  'egg coffee': 'Cà phê trứng',
  'hidden gem': 'Ẩn mình',
  'vintage atmosphere': 'Phong cách vintage',
  'speakeasy': 'Speakeasy',
  'cocktail': 'Cocktail',
  'live music': 'Nhạc sống',
  'hidden bar': 'Bar ẩn',
  'cozy atmosphere': 'Ấm cúng',
  'rooftop bar': 'Rooftop bar',
  'sky lounge': 'Sky lounge',
  '360 view': 'View 360°',
  'sunset': 'Hoàng hôn',
  'cocktails': 'Cocktail',
  'minimal design': 'Thiết kế tối giản',
  'cozy space': 'Không gian ấm cúng',
  'pastries': 'Bánh ngọt',
};

function localizeHighlight(h: string): string {
  return HIGHLIGHT_VI[h.toLowerCase()] || h;
}

/**
 * Check if location is likely open now based on opening_hours.
 * Returns 'open', 'closed', or null (unknown).
 */
function getOpenStatus(openingHours: Record<string, string> | null | undefined): 'open' | 'closed' | null {
  if (!openingHours || typeof openingHours !== 'object') return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const hours = openingHours[dayName];
  if (!hours || typeof hours !== 'string') return null;

  const parts = hours.split('-');
  if (parts.length !== 2) return null;

  const [openStr, closeStr] = parts;
  const [openH, openM] = openStr.trim().split(':').map(Number);
  const [closeH, closeM] = closeStr.trim().split(':').map(Number);
  if (isNaN(openH) || isNaN(closeH)) return null;

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + (openM || 0);
  let closeMins = closeH * 60 + (closeM || 0);

  // Handle overnight hours (e.g. 18:00-02:00)
  if (closeMins <= openMins) {
    // Before midnight or after midnight?
    if (nowMins >= openMins || nowMins < closeMins) return 'open';
    return 'closed';
  }

  return nowMins >= openMins && nowMins < closeMins ? 'open' : 'closed';
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

  // Review summary (filtered for junk)
  const cleanSummary = cleanReviewSummary(location?.google_review_summary);

  // Highlights: up to 3, localized
  const highlights = (location?.google_highlights || [])
    .slice(0, 3)
    .map(localizeHighlight);

  // Category name
  const categoryName = location?.location_categories?.[0]?.categories?.name;

  // Open/closed status
  const openStatus = getOpenStatus(location?.opening_hours as Record<string, string> | null);

  // Short address: just street name
  const shortAddress = location?.address
    ? location.address.split(',')[0].trim()
    : null;

  return (
    <div className="perspective-1000 h-[28rem] w-full">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

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

                {/* Name + location overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-base text-white drop-shadow-md line-clamp-1">{location.name}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-xs mt-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{shortAddress || location.district}</span>
                    </div>
                    {location.district && shortAddress && (
                      <span className="text-white/60">· {location.district}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info section */}
              <CardContent className="p-3 flex flex-col flex-grow gap-1.5 overflow-hidden">
                {/* Row: Price + Open status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {location.price_range && (
                      <span className="font-semibold text-vietnam-blue-700" title={formatPriceRange(location.price_range)}>
                        {location.price_range}
                      </span>
                    )}
                    {location.price_range && (
                      <span className="text-slate-400">·</span>
                    )}
                    {reviewCount && reviewCount > 0 && (
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <MessageSquare className="h-3 w-3" />
                        {reviewCount} đánh giá
                      </span>
                    )}
                  </div>
                  {openStatus && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className={cn(
                        'font-medium text-[11px]',
                        openStatus === 'open' ? 'text-green-600' : 'text-red-500'
                      )}>
                        {openStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Highlight tags */}
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 text-[10px] bg-vietnam-gold-50 text-vietnam-blue-700 border border-vietnam-gold-200 rounded-full px-2 py-0.5"
                      >
                        <Tag className="h-2.5 w-2.5 text-vietnam-gold-500" />
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review summary — the main convincing text */}
                {cleanSummary && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">
                    &ldquo;{cleanSummary}&rdquo;
                  </p>
                )}

                {/* Fallback: description if no review summary */}
                {!cleanSummary && location.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {location.description}
                  </p>
                )}

                {/* CTA button pinned to bottom */}
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
