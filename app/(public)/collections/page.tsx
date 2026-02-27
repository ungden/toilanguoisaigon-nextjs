"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCollections } from "@/hooks/data/useCollections";
import { FALLBACK_IMAGES, FEATURED_COLLECTIONS } from "@/utils/constants";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";

const CollectionsPage = () => {
  const { data: collections, isLoading } = useCollections();

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

      <section className="container mx-auto py-16 px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
        ) : sortedCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCollections.map((collection) => {
              const imagePath = collection.cover_image_url ? getPathFromSupabaseUrl(collection.cover_image_url) : null;
              const optimizedImageUrl = imagePath
                ? getTransformedImageUrl(imagePath, { width: 400, height: 300 })
                : FALLBACK_IMAGES.collection;

              const isFeatured = featuredTitles.includes(collection.title);

              return (
                <Link href={`/collection/${collection.slug}`} key={collection.id} className="block group">
                  <Card className="overflow-hidden card-hover border-vietnam-blue-200 h-full flex flex-col bg-white">
                    <div className="relative overflow-hidden">
                      <Image
                        src={
                          FEATURED_COLLECTIONS.find(fc => fc.title === collection.title)?.overrideImage
                            ?? optimizedImageUrl
                        }
                        alt={collection.title}
                        className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        width={400}
                        height={300}
                        loading="lazy"
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
    </div>
  );
};

export default CollectionsPage;
