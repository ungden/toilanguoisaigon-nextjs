import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

export type SearchResult = {
  name: string;
  slug: string;
  district: string;
  image: string;
  rating: number;
  reviewCount: number;
  cuisine: string;
  priceRange: string;
};

interface SearchResultCardProps {
  place: SearchResult;
}

export function SearchResultCard({ place }: SearchResultCardProps) {
  return (
    <Link to={`/place/${place.slug}`} className="block">
      <Card className="flex flex-col sm:flex-row overflow-hidden hover:shadow-lg transition-shadow w-full">
        <img
          src={place.image}
          alt={place.name}
          className="w-full sm:w-48 h-48 sm:h-auto object-cover flex-shrink-0"
        />
        <CardContent className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{place.name}</h3>
              <Badge variant="secondary">{place.cuisine}</Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{place.rating}</span>
              <span className="mx-1">·</span>
              <span>({place.reviewCount} đánh giá)</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {place.district}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Khoảng giá: {place.priceRange}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}