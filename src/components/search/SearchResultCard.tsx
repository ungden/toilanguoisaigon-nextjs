import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Location } from "@/types/database";
import { formatPriceRange, cleanReviewSummary } from "@/utils/formatters";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { getCategoryArtwork } from "@/utils/constants";
import { Badge } from "@/components/ui/badge";

interface SearchResultCardProps {
  place: Location;
}

export function SearchResultCard({ place }: SearchResultCardProps) {
  const imagePath = place.main_image_url ? getPathFromSupabaseUrl(place.main_image_url) : null;
  const optimizedImageUrl = imagePath 
    ? getTransformedImageUrl(imagePath, { width: 400, height: 400 }) 
    : getCategoryArtwork(place.name);

  return (
    <Link href={`/place/${place.slug}`} className="block group">
      <Card className="flex flex-col sm:flex-row overflow-hidden card-hover border-slate-200 transition-all hover:border-vietnam-red-300 w-full relative">
        <div className="absolute top-3 right-3 sm:right-auto sm:left-3 z-10">
          <button className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-vietnam-red-600 hover:text-white transition-colors border border-white/20 shadow-sm" onClick={(e) => { e.preventDefault(); /* TODO: Implement save */ }}>
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
          <Image
            src={optimizedImageUrl}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fill
            sizes="(max-width: 640px) 100vw, 192px"
            loading="lazy"
          />
        </div>
        <CardContent className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors line-clamp-1">{place.name}</h3>
            </div>
            
            <div className="flex items-center text-sm text-slate-500 mb-3 gap-2">
              <div className="flex items-center text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded-md font-medium">
                <Star className="h-3.5 w-3.5 mr-1 fill-yellow-500 text-yellow-500" />
                <span>{place.average_rating > 0 ? place.average_rating.toFixed(1) : 'Mới'}</span>
              </div>
              {place.review_count > 0 && (
                <span className="text-xs">({place.review_count} đánh giá)</span>
              )}
            </div>

            <div className="space-y-1.5 text-sm text-vietnam-blue-600">
              <p className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-vietnam-red-500 flex-shrink-0" />
                <span className="truncate">{place.address}, {place.district}</span>
              </p>
            </div>
            
            {cleanReviewSummary(place.google_review_summary) && (
              <p className="text-sm text-slate-500 italic line-clamp-2 mt-3 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
                &quot;{cleanReviewSummary(place.google_review_summary)}&quot;
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            {place.location_categories?.[0]?.categories?.name ? (
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">
                {place.location_categories[0].categories.name}
              </Badge>
            ) : <div />}
            {place.price_range && (
              <span className="text-vietnam-gold-600 font-medium px-2 py-1 bg-vietnam-gold-50 rounded-md text-xs">
                {formatPriceRange(place.price_range)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
