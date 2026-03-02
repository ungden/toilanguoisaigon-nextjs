"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, ArrowRight, Sparkles, MessageSquare, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useCollections } from "@/hooks/data/useCollections";
import { useFeaturedLocations } from "@/hooks/data/useFeaturedLocations";
import { useTrendingLocations } from "@/hooks/data/useTrendingLocations";
import { useBlogPosts } from "@/hooks/data/useBlogPosts";
import { useRecentReviews } from "@/hooks/data/useRecentReviews";
import { useStats } from "@/hooks/data/useStats";
import { showError } from "@/utils/toast";
import { formatPriceRange, cleanReviewSummary } from "@/utils/formatters";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { MysteryLocationCards } from "@/components/collections/MysteryLocationCards";
import { FALLBACK_IMAGES, FEATURED_COLLECTIONS, getCategoryArtwork } from "@/utils/constants";
import { DailyCheckin } from "@/components/gamification/DailyCheckin";
import { getLocationBadges } from "@/utils/badges";

const BLOG_CATEGORIES: Record<string, string> = {
  guide: "Hướng dẫn",
  listicle: "Danh sách",
  culture: "Văn hóa",
  tip: "Mẹo hay",
  review: "Review",
};

const Index = () => {
  const router = useRouter();
  const { data: collections, isLoading: isLoadingCollections } = useCollections();
  const { data: newPlaces, isLoading: isLoadingNewPlaces, error: locationsError } = useFeaturedLocations(8);
  const { data: trendingPlaces, isLoading: isLoadingTrending } = useTrendingLocations(8);
  const { data: blogData, isLoading: isLoadingPosts, error: postsError } = useBlogPosts({ page: 1, pageSize: 7 });
  const { data: stats } = useStats();
  const { data: recentReviews } = useRecentReviews(6);

  const posts = blogData?.posts || [];
  const featuredPost = posts[0];
  const sidePosts = posts.slice(1, 7);

  // Track collection images that failed to load so we can swap to fallback
  const [failedCollectionImages, setFailedCollectionImages] = useState<Set<string | number>>(new Set());
  const handleCollectionImageError = useCallback((collectionId: string | number) => {
    setFailedCollectionImages(prev => {
      const next = new Set(prev);
      next.add(collectionId);
      return next;
    });
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

    // Shuffle the non-pinned collections for variety on each visit
    const shuffled = [...otherItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return [...priorityItems, ...shuffled].slice(0, 8);
  }, [collections, featuredTitles]);

  useEffect(() => {
    if (locationsError) {
      showError("Không thể tải danh sách địa điểm. Vui lòng thử lại sau.");
    }
  }, [locationsError]);

  useEffect(() => {
    if (postsError) {
      showError("Không thể tải bài viết. Vui lòng thử lại sau.");
    }
  }, [postsError]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("query") as string;
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/search');
    }
  };

  const getPostImageUrl = (coverUrl: string | null) => {
    const imagePath = coverUrl ? getPathFromSupabaseUrl(coverUrl) : null;
    return imagePath
      ? getTransformedImageUrl(imagePath, { width: 800, height: 450 })
      : FALLBACK_IMAGES.collection;
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Compact Top Bar: Search + Stats */}
      <section className="bg-vietnam-blue-600 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vietnam-blue-400" />
                  <Input
                    type="text"
                    name="query"
                    placeholder="Tìm quán ăn, món ngon, khu vực..."
                    className="h-9 text-sm pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 rounded-lg"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/nearby')}
                  className="h-9 text-white/90 hover:text-white hover:bg-white/10 text-xs"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Gần tôi
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 bg-vietnam-red-600 hover:bg-vietnam-red-700 text-white text-xs rounded-lg"
                >
                  Tìm
                </Button>
              </div>
            </form>
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-vietnam-gold-300" />
                <span className="font-bold text-vietnam-gold-300">{stats ? `${stats.locationCount}+` : '...'}</span>
                <span className="text-white/70">địa điểm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-vietnam-gold-300" />
                <span className="font-bold text-vietnam-gold-300">{stats ? `${stats.reviewCount}+` : '...'}</span>
                <span className="text-white/70">đánh giá</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-vietnam-gold-300" />
                <span className="font-bold text-vietnam-gold-300">{stats ? `${stats.collectionCount}+` : '...'}</span>
                <span className="text-white/70">bộ sưu tập</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Check-in Banner */}
      <section className="container mx-auto px-4 mt-4">
        <DailyCheckin />
      </section>

      {/* NEWS SECTION — Featured Post + Latest Posts */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-vietnam-blue-800 flex items-center gap-2">
            <span className="w-1 h-7 bg-vietnam-red-600 rounded-full inline-block"></span>
            Tin mới nhất
          </h2>
          <Link href="/blog" className="text-sm font-semibold text-vietnam-red-600 hover:text-vietnam-red-700 flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoadingPosts ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4 mt-4" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-24 h-16 rounded-md flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : featuredPost ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Post — Large */}
            <div className="lg:col-span-2">
              <Link href={`/blog/${featuredPost.slug}`} className="block group">
                <div className="relative overflow-hidden rounded-lg">
                  <Image
                    src={getPostImageUrl(featuredPost.cover_image_url)}
                    alt={featuredPost.title}
                    className="aspect-[16/9] w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    width={800}
                    height={450}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                    {featuredPost.category && (
                      <Badge className="bg-vietnam-red-600 text-white text-xs border-none mb-3">
                        {BLOG_CATEGORIES[featuredPost.category] || featuredPost.category}
                      </Badge>
                    )}
                    <h3 className="text-xl md:text-3xl font-bold text-white leading-tight mb-2 group-hover:text-vietnam-gold-200 transition-colors">
                      {featuredPost.title}
                    </h3>
                    <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-white/60 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      {featuredPost.reading_time > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {featuredPost.reading_time} phút đọc
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Side Posts — Latest List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-slate-200 h-full">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-vietnam-blue-800 flex items-center gap-2">
                    <span className="w-1 h-5 bg-vietnam-gold-500 rounded-full inline-block"></span>
                    Bài viết mới
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {sidePosts.map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="flex gap-3 p-3 hover:bg-slate-50 transition-colors group">
                      <div className="relative w-20 h-14 md:w-24 md:h-16 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={getPostImageUrl(post.cover_image_url)}
                          alt={post.title}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {post.category && (
                          <span className="text-[10px] font-bold text-vietnam-red-600 uppercase tracking-wide">
                            {BLOG_CATEGORIES[post.category] || post.category}
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-vietnam-blue-800 line-clamp-2 leading-tight group-hover:text-vietnam-red-600 transition-colors">
                          {post.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                          {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-slate-100">
                  <Link href="/blog" className="text-xs font-semibold text-vietnam-red-600 hover:text-vietnam-red-700 flex items-center justify-center gap-1">
                    Xem tất cả bài viết <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-vietnam-blue-600">Chưa có bài viết nào. Hãy quay lại sau!</p>
          </div>
        )}
      </section>

      {/* Collections Section */}
      <section className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-vietnam-blue-800 flex items-center gap-2">
              <span className="w-1 h-7 bg-vietnam-gold-500 rounded-full inline-block"></span>
              Bộ sưu tập
            </h2>
            <Link href="/collections" className="text-sm font-semibold text-vietnam-red-600 hover:text-vietnam-red-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoadingCollections ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardHeader className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </CardHeader>
                </Card>
              ))
            ) : sortedCollections && sortedCollections.length > 0 ? (
              sortedCollections.map((collection, index) => {
                const imageFailed = failedCollectionImages.has(collection.id);
                const imagePath = (!imageFailed && collection.cover_image_url) ? getPathFromSupabaseUrl(collection.cover_image_url) : null;
                const optimizedImageUrl = imagePath 
                  ? getTransformedImageUrl(imagePath, { width: 400, height: 300 }) 
                  : FALLBACK_IMAGES.collection;
                const finalSrc = FEATURED_COLLECTIONS.find(fc => fc.title === collection.title)?.overrideImage
                  ?? optimizedImageUrl;

                const countObj = collection.location_count?.[0] as { count: number } | undefined;
                const locationCount = countObj?.count || 0;

                return (
                  <Link href={`/collection/${collection.slug}`} key={collection.id} className="block group">
                    <Card className="overflow-hidden card-hover border-slate-200 h-full flex flex-col bg-white">
                      <div className="relative overflow-hidden aspect-[4/3] w-full">
                        <Image 
                          src={finalSrc}
                          alt={collection.title} 
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={() => handleCollectionImageError(collection.id)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                        {index < 2 && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-vietnam-gold-500 text-white border-vietnam-gold-600 shadow-lg text-[10px] px-1.5 py-0.5">
                              <Sparkles className="h-2.5 w-2.5 mr-1" />
                              Hot
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-3 bg-white flex-grow pb-3">
                        <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-sm font-bold leading-tight line-clamp-1">
                          {collection.title}
                        </CardTitle>
                        {locationCount > 0 && (
                          <div className="text-[10px] text-vietnam-blue-500 flex items-center mt-0.5">
                            <MapPin className="h-2.5 w-2.5 mr-0.5" />
                            {locationCount} địa điểm
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-vietnam-blue-600">Chưa có bộ sưu tập nào. Hãy quay lại sau!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Locations */}
      <section className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-vietnam-blue-800 flex items-center gap-2">
            <span className="w-1 h-7 bg-vietnam-red-600 rounded-full inline-block"></span>
            Được yêu thích nhất
          </h2>
          <Link href="/search" className="text-sm font-semibold text-vietnam-red-600 hover:text-vietnam-red-700 flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoadingNewPlaces ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-5 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : newPlaces && newPlaces.length > 0 ? (
            newPlaces.map((place) => {
              const imagePath = place.main_image_url ? getPathFromSupabaseUrl(place.main_image_url) : null;
              const optimizedImageUrl = imagePath 
                ? getTransformedImageUrl(imagePath, { width: 400, height: 300 }) 
                : getCategoryArtwork(place.name);
              const badges = getLocationBadges(place);
              
              return (
                <Link href={`/place/${place.slug}`} key={place.id} className="block group">
                  <Card className="overflow-hidden card-hover border-slate-200 h-full bg-white">
                    <div className="relative overflow-hidden aspect-[4/3] w-full">
                      <Image 
                        src={optimizedImageUrl} 
                        alt={place.name} 
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                        {badges.map((b) => (
                          <Badge key={b.type} variant="outline" className={`${b.className} text-[10px] shadow-md px-1.5 py-0.5 font-semibold`}>
                            {b.label}
                          </Badge>
                        ))}
                        <Badge className="bg-vietnam-red-600 text-white text-[10px] shadow-md border-none px-1.5 py-0.5">
                          {place.district}
                        </Badge>
                      </div>
                      {place.review_count > 0 && (
                        <div className="absolute top-2 right-2">
                          <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded-full border border-white/20">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {place.review_count}
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center text-white gap-1.5">
                          <div className="flex items-center bg-vietnam-gold-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
                            <Star className="h-3 w-3 fill-white mr-0.5 text-white" />
                            {place.average_rating > 0 ? place.average_rating.toFixed(1) : 'Mới'}
                          </div>
                          {place.price_range && (
                            <span className="text-[10px] text-white/80 font-medium">
                              {formatPriceRange(place.price_range)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors line-clamp-1">
                        {place.name}
                      </h3>
                      <div className="flex items-center text-xs text-vietnam-blue-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-vietnam-red-400" />
                        <span className="truncate">{place.address}</span>
                      </div>
                      {cleanReviewSummary(place.google_review_summary) && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-1.5">
                          &quot;{cleanReviewSummary(place.google_review_summary)}&quot;
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          ) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-vietnam-blue-600">Chưa có địa điểm nào. Hãy quay lại sau!</p>
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      {(isLoadingTrending || (trendingPlaces && trendingPlaces.length > 0)) && (
        <section className="bg-gradient-to-b from-orange-50 to-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-vietnam-blue-800 flex items-center gap-2">
                <span className="w-1 h-7 bg-orange-500 rounded-full inline-block"></span>
                Xu hướng hôm nay
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {isLoadingTrending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-3">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : trendingPlaces && trendingPlaces.length > 0 ? (
                trendingPlaces.slice(0, 8).map((place) => {
                  const imagePath = place.main_image_url ? getPathFromSupabaseUrl(place.main_image_url) : null;
                  const optimizedImageUrl = imagePath
                    ? getTransformedImageUrl(imagePath, { width: 400, height: 300 })
                    : getCategoryArtwork(place.name);
                  const badges = getLocationBadges(place);

                  return (
                    <Link href={`/place/${place.slug}`} key={place.id} className="block group">
                      <Card className="overflow-hidden card-hover border-orange-200 h-full bg-white">
                        <div className="relative overflow-hidden aspect-[4/3] w-full">
                          <Image
                            src={optimizedImageUrl}
                            alt={place.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                            {badges.map((b) => (
                              <Badge key={b.type} variant="outline" className={`${b.className} text-[10px] shadow-md px-1.5 py-0.5 font-semibold`}>
                                {b.label}
                              </Badge>
                            ))}
                            <Badge className="bg-vietnam-red-600 text-white text-[10px] shadow-md border-none px-1.5 py-0.5">
                              {place.district}
                            </Badge>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center text-white gap-1.5">
                              <div className="flex items-center bg-vietnam-gold-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
                                <Star className="h-3 w-3 fill-white mr-0.5 text-white" />
                                {place.average_rating > 0 ? place.average_rating.toFixed(1) : 'Mới'}
                              </div>
                              {place.price_range && (
                                <span className="text-[10px] text-white/80 font-medium">
                                  {formatPriceRange(place.price_range)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-bold text-sm text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors line-clamp-1">
                            {place.name}
                          </h3>
                          <div className="flex items-center text-xs text-vietnam-blue-500 mt-1">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-vietnam-red-400" />
                            <span className="truncate">{place.address}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* Mystery Box Section */}
      <section className="bg-vietnam-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-vietnam-blue-800 flex items-center gap-2">
              <span className="w-1 h-7 bg-vietnam-blue-600 rounded-full inline-block"></span>
              Đi Đâu Cũng Được
            </h2>
          </div>
          <p className="text-sm text-vietnam-blue-600 mb-6">
            Không biết đi đâu? Hãy để chúng tôi chọn giúp bạn một địa điểm ngẫu nhiên!
          </p>
          <MysteryLocationCards />
        </div>
      </section>

      {/* Recent Reviews Section */}
      {recentReviews && recentReviews.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-vietnam-blue-800 flex items-center gap-2">
                <span className="w-1 h-7 bg-vietnam-gold-500 rounded-full inline-block"></span>
                Cộng đồng nói gì?
              </h2>
              <Link href="/reviews" className="text-sm font-semibold text-vietnam-red-600 hover:text-vietnam-red-700 flex items-center gap-1">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReviews.map((review) => (
                <Link href={`/place/${review.locations?.slug}`} key={review.id} className="block group">
                  <Card className="h-full border-slate-200 hover:border-vietnam-red-300 hover:shadow-md transition-all bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="h-8 w-8 rounded-full bg-vietnam-red-100 flex items-center justify-center text-vietnam-red-700 font-bold text-xs flex-shrink-0">
                          {review.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-vietnam-blue-800 truncate">
                            {review.profiles?.full_name || 'Ẩn danh'}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-2.5 w-2.5 ${i < review.rating ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-vietnam-blue-700 leading-relaxed line-clamp-2 mb-2">
                          {review.comment}
                        </p>
                      )}
                      <div className="flex items-center text-[10px] text-vietnam-red-600 font-medium group-hover:text-vietnam-red-700">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />
                        {review.locations?.name || 'Địa điểm'}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
