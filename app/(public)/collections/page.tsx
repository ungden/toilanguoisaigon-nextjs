"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection, CollectionCategory, Playlist } from '@/types/database';
import { Clock, MapPin, Target, Palette, Users, Award, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FALLBACK_IMAGES } from "@/utils/constants";

interface CollectionWithCategory extends Omit<Collection, 'collection_categories'> {
  collection_categories: Pick<CollectionCategory, 'name' | 'slug' | 'icon'> | null;
}

const fetchCollectionsWithCategories = async (): Promise<CollectionWithCategory[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_categories (
        name,
        slug,
        icon
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as CollectionWithCategory[]) || [];
};

const fetchPublishedPlaylists = async (): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('status', 'published')
    .order('generated_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Playlist[]) || [];
};

const MOOD_LABELS: Record<string, string> = {
  morning: "Buổi sáng",
  lunch: "Buổi trưa",
  dinner: "Buổi tối",
  "late-night": "Ăn khuya",
  "rainy-day": "Ngày mưa",
  weekend: "Cuối tuần",
  "date-night": "Hẹn hò",
  family: "Gia đình",
  budget: "Bình dân",
  premium: "Cao cấp",
  adventure: "Phiêu lưu",
  comfort: "Comfort food",
  healthy: "Healthy",
  "street-food": "Street food",
  seasonal: "Theo mùa",
};

const getIconComponent = (iconName: string | null) => {
  const icons: Record<string, typeof MapPin> = {
    Clock,
    MapPin,
    Target,
    Palette,
    Users,
    Award
  };
  return icons[iconName || 'MapPin'] || MapPin;
};

const CollectionsPage = () => {
  const { data: collections, isLoading: isLoadingCollections } = useQuery<CollectionWithCategory[], Error>({
    queryKey: ['collections-with-categories'],
    queryFn: fetchCollectionsWithCategories,
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[], Error>({
    queryKey: ['playlists-published'],
    queryFn: fetchPublishedPlaylists,
  });

  const isLoading = isLoadingCollections || isLoadingPlaylists;

  // Group collections by category
  const groupedCollections = collections?.reduce((acc, collection) => {
    const categoryName = collection.collection_categories?.name || 'Khác';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        category: collection.collection_categories,
        collections: []
      };
    }
    acc[categoryName].collections.push(collection);
    return acc;
  }, {} as Record<string, { category: Pick<CollectionCategory, 'name' | 'slug' | 'icon'> | null, collections: CollectionWithCategory[] }>);

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="bg-vietnam-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Bộ Sưu Tập Đặc Biệt
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Khám phá Sài Gòn qua những góc nhìn độc đáo — từ bộ sưu tập chuyên gia đến gợi ý AI hàng ngày
          </p>
        </div>
      </section>

      <section className="container mx-auto py-16 px-4">
        {isLoading ? (
          <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, categoryIndex) => (
              <div key={categoryIndex}>
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
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
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {/* AI-generated playlists section */}
            {playlists && playlists.length > 0 && (
              <div>
                <div className="flex items-center mb-8">
                  <Sparkles className="h-8 w-8 text-vietnam-red-600 mr-3" />
                  <h2 className="text-3xl font-bold text-vietnam-blue-800">Gợi ý từ AI</h2>
                  <Badge className="ml-3 bg-vietnam-red-100 text-vietnam-red-700">
                    Cập nhật hàng ngày
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {playlists.map((playlist) => (
                    <Link href={`/playlist/${playlist.slug}`} key={playlist.id} className="block group">
                      <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full">
                        <div className="relative overflow-hidden">
                          <Image 
                            src={playlist.cover_image_url || FALLBACK_IMAGES.collection} 
                            alt={playlist.title} 
                            className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            width={400}
                            height={300}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute top-4 left-4 flex gap-2">
                            {playlist.emoji && (
                              <span className="text-2xl drop-shadow-lg">{playlist.emoji}</span>
                            )}
                            {playlist.mood && (
                              <Badge className="bg-vietnam-red-600 text-white">
                                {MOOD_LABELS[playlist.mood] || playlist.mood}
                              </Badge>
                            )}
                          </div>
                          {playlist.location_count > 0 && (
                            <div className="absolute bottom-4 right-4">
                              <Badge variant="secondary" className="bg-black/60 text-white border-none">
                                {playlist.location_count} địa điểm
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader className="bg-white flex-grow">
                          <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg leading-tight">
                            {playlist.title}
                          </CardTitle>
                          <CardDescription className="text-vietnam-blue-600 text-sm leading-relaxed line-clamp-2">
                            {playlist.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Manual collections by category */}
            {Object.entries(groupedCollections || {}).map(([categoryName, { category, collections: catCollections }]) => {
              const IconComponent = getIconComponent(category?.icon);
              
              return (
                <div key={categoryName}>
                  <div className="flex items-center mb-8">
                    <IconComponent className="h-8 w-8 text-vietnam-red-600 mr-3" />
                    <h2 className="text-3xl font-bold text-vietnam-blue-800">{categoryName}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {catCollections.map((collection) => (
                      <Link href={`/collection/${collection.slug}`} key={collection.id} className="block group">
                        <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full">
                          <div className="relative overflow-hidden">
                            <Image 
                              src={collection.cover_image_url || FALLBACK_IMAGES.collection} 
                              alt={collection.title} 
                              className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500"
                              width={400}
                              height={300}
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-vietnam-blue-600 text-white">
                                {categoryName}
                              </Badge>
                            </div>
                          </div>
                          <CardHeader className="bg-white flex-grow">
                            <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg leading-tight">
                              {collection.title}
                            </CardTitle>
                            <CardDescription className="text-vietnam-blue-600 text-sm leading-relaxed">
                              {collection.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CollectionsPage;
