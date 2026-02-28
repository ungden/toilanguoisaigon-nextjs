"use client";

import { Location } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { getPathFromSupabaseUrl, getTransformedImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { getCategoryArtwork, BRAND_ASSETS } from '@/utils/constants';
import { ArrowRight } from 'lucide-react';

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

  return (
    <div className="perspective-1000 h-80 w-full">
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

        {/* Card Front (Revealed) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          {location && (
            <Card className="w-full h-full overflow-hidden flex flex-col">
              <Image src={optimizedImageUrl} alt={location.name} className="w-full h-40 object-cover" width={400} height={160} />
              <CardContent className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-bold text-lg text-vietnam-blue-800 line-clamp-2">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">{location.district}</p>
                </div>
                <Button asChild size="sm" className="w-full mt-2 btn-vietnam">
                  <Link href={`/place/${location.slug}`}>
                    Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
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
