"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection, Location, CollectionCategory, CollectionLocation } from '@/types/database';
import { formatPriceRange, formatOpeningHours } from "@/utils/formatters";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { FALLBACK_IMAGES, getCategoryArtwork } from "@/utils/constants";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface CollectionWithLocations extends Omit<Collection, 'collection_categories'> {
  collection_categories: Pick<CollectionCategory, 'name' | 'slug' | 'icon'> | null;
  collection_locations: (Pick<CollectionLocation, 'position' | 'ai_note'> & {
    locations: Location;
  })[];
}

const fetchCollectionDetail = async (slug: string): Promise<CollectionWithLocations | null> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_categories (
        name,
        slug,
        icon
      ),
      collection_locations (
        position,
        ai_note,
        locations (*)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CollectionWithLocations | null;
};

const CollectionDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: collection, isLoading, error } = useQuery<CollectionWithLocations | null, Error>({
    queryKey: ['collection-detail', slug],
    queryFn: () => fetchCollectionDetail(slug!),
    enabled: !!slug,
  });

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

  if (error || !collection) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy bộ sưu tập</h1>
          <p className="text-vietnam-blue-600">Bộ sưu tập bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <Link href="/collections" className="text-vietnam-red-600 hover:underline mt-4 inline-block">
            ← Quay lại danh sách bộ sưu tập
          </Link>
        </div>
      </div>
    );
  }

  const isAI = collection.source === 'ai';
  const locationsWithNotes = collection.collection_locations
    .filter(cl => cl.locations != null)
    .map(cl => ({ ...cl.locations, ai_note: cl.ai_note, position: cl.position }));
  const locations = locationsWithNotes;

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative py-16 bg-vietnam-red-600 overflow-hidden">
        <Image
          src={collection.cover_image_url || FALLBACK_IMAGES.collectionHero}
          alt={collection.title}
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              {isAI && collection.emoji && (
                <span className="text-4xl drop-shadow-lg">{collection.emoji}</span>
              )}
              {collection.collection_categories && (
                <Badge className="bg-vietnam-blue-600 text-white">
                  {collection.collection_categories.name}
                </Badge>
              )}
              {isAI && (
                <Badge className="bg-vietnam-gold-500 text-white border-none">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI gợi ý
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {collection.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              {collection.description}
            </p>
            <div className="mt-8">
              <span className="text-vietnam-gold-400 font-semibold">
                {locations.length} địa điểm được tuyển chọn
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((location) => {
            const imagePath = location.main_image_url ? getPathFromSupabaseUrl(location.main_image_url) : null;
            const optimizedImageUrl = imagePath 
              ? getTransformedImageUrl(imagePath, { width: 400, height: 300 }) 
              : getCategoryArtwork(location.name);

            return (
              <Link href={`/place/${location.slug}`} key={location.id} className="block group">
                <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full bg-white">
                  <div className="relative overflow-hidden">
                    <Image 
                      src={optimizedImageUrl} 
                      alt={location.name} 
                      className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      width={400}
                      height={300}
                      loading="lazy"
                    />
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
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{formatOpeningHours(location.opening_hours)}</span>
                      </div>
                    </div>

                    {location.average_rating > 0 && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-vietnam-gold-500 fill-vietnam-gold-500 mr-1" />
                        <span className="text-sm font-medium text-vietnam-blue-700">
                          {location.average_rating.toFixed(1)} ({location.review_count} đánh giá)
                        </span>
                      </div>
                    )}

                    {location.description && (
                      <p className="text-sm text-vietnam-blue-600 mt-3 line-clamp-2">
                        {location.description}
                      </p>
                    )}

                    {/* AI note - shown for AI-generated collections */}
                    {isAI && location.ai_note && (
                      <div className="mt-3 p-2 rounded-md bg-vietnam-gold-50 border border-vietnam-gold-200">
                        <p className="text-xs text-vietnam-gold-700 italic flex items-start gap-1">
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
};

export default CollectionDetailPage;
