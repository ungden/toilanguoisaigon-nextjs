import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Location } from "@/types/database";
import { formatPriceRange } from "@/utils/formatters";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";

interface SearchResultCardProps {
  place: Location;
}

export function SearchResultCard({ place }: SearchResultCardProps) {
  const imagePath = place.main_image_url ? getPathFromSupabaseUrl(place.main_image_url) : null;
  const optimizedImageUrl = imagePath 
    ? getTransformedImageUrl(imagePath, { width: 400, height: 400 }) 
    : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop';

  return (
    <Link to={`/place/${place.slug}`} className="block">
      <Card className="flex flex-col sm:flex-row overflow-hidden hover:shadow-lg transition-shadow w-full">
        <img
          src={optimizedImageUrl}
          alt={place.name}
          className="w-full sm:w-48 h-48 sm:h-auto object-cover flex-shrink-0"
        />
        <CardContent className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{place.name}</h3>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{place.average_rating}</span>
              <span className="mx-1">·</span>
              <span>({place.review_count} đánh giá)</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {place.district}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Khoảng giá: {formatPriceRange(place.price_range)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}