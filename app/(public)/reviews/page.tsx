"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, MessageSquare, ArrowLeft, ArrowRight, Camera, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAllReviews } from "@/hooks/data/useAllReviews";
import { useLikeReview, useUnlikeReview } from "@/hooks/data/useReviewLikes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { showError } from "@/utils/toast";
import { Location } from "@/types/database";

const ITEMS_PER_PAGE = 20;

export default function ReviewsPage() {
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const likeReview = useLikeReview();
  const unlikeReview = useUnlikeReview();
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAllReviews({
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
    sort,
  });

  const reviews = useMemo(() => data?.reviews || [], [data?.reviews]);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Fetch which reviews the current user has liked
  useEffect(() => {
    if (!user || reviews.length === 0) return;
    const reviewIds = reviews.map(r => r.id);
    supabase
      .from('review_likes')
      .select('review_id')
      .eq('user_id', user.id)
      .in('review_id', reviewIds)
      .then(({ data: likes }) => {
        if (likes) setLikedReviews(new Set(likes.map(l => l.review_id)));
      });
  }, [user, reviews]);

  const handleToggleLike = (reviewId: string) => {
    if (!user) {
      showError('Vui lòng đăng nhập để thích đánh giá.');
      return;
    }
    if (likedReviews.has(reviewId)) {
      setLikedReviews(prev => { const next = new Set(prev); next.delete(reviewId); return next; });
      unlikeReview.mutate({ reviewId, userId: user.id });
    } else {
      setLikedReviews(prev => new Set(prev).add(reviewId));
      likeReview.mutate({ reviewId, userId: user.id });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="h-8 w-8 text-vietnam-red-600" />
          <h1 className="text-3xl font-bold text-vietnam-blue-800">Đánh giá từ cộng đồng</h1>
        </div>
        <p className="text-vietnam-blue-600 text-lg">
          Trải nghiệm thật từ những người đã đến — {total.toLocaleString('vi-VN')} đánh giá
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(0); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="highest">Điểm cao nhất</SelectItem>
              <SelectItem value="lowest">Điểm thấp nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-slate-500">
          Trang {page + 1} / {Math.max(totalPages, 1)}
        </p>
      </div>

      {/* Review List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => {
            const loc = review.locations as unknown as Pick<Location, 'name' | 'slug' | 'district' | 'main_image_url'> | null;
            const locImagePath = loc?.main_image_url ? getPathFromSupabaseUrl(loc.main_image_url) : null;
            const locImage = locImagePath ? getTransformedImageUrl(locImagePath, { width: 80, height: 80 }) : null;

            return (
              <Card key={review.id} className="border-vietnam-blue-100 hover:border-vietnam-red-200 transition-colors">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Location thumbnail */}
                    <Link href={`/place/${loc?.slug}`} className="flex-shrink-0 hidden sm:block">
                      {locImage ? (
                        <Image
                          src={locImage}
                          alt={loc?.name || ''}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover w-20 h-20"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-vietnam-red-50 flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-vietnam-red-300" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      {/* Location name + district */}
                      <Link href={`/place/${loc?.slug}`} className="group">
                        <h3 className="font-bold text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors">
                          {loc?.name || 'Địa điểm'}
                        </h3>
                        {loc?.district && (
                          <span className="text-xs text-slate-500">{loc.district}</span>
                        )}
                      </Link>

                      {/* Reviewer info */}
                      <div className="flex items-center gap-2 mt-2 mb-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={review.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-vietnam-red-100 text-vietnam-red-700 text-xs">
                            {review.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-vietnam-blue-700">
                          {review.profiles?.full_name || 'Ẩn danh'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-sm text-vietnam-blue-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}

                      {/* Photos */}
                      {review.image_urls && review.image_urls.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.image_urls.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                              <Image src={url} alt={`Ảnh ${idx + 1}`} fill className="object-cover" />
                            </div>
                          ))}
                          {review.image_urls.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Camera className="h-4 w-4 text-slate-400" />
                              <span className="text-xs text-slate-500 ml-0.5">+{review.image_urls.length - 4}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Like button */}
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs ${likedReviews.has(review.id) ? 'text-vietnam-red-600' : 'text-slate-400 hover:text-vietnam-red-500'}`}
                          onClick={() => handleToggleLike(review.id)}
                          aria-label="Hữu ích"
                        >
                          <Heart className={`h-3.5 w-3.5 mr-1 ${likedReviews.has(review.id) ? 'fill-vietnam-red-600' : ''}`} />
                          Hữu ích
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-vietnam-blue-800">Chưa có đánh giá nào</h2>
          <p className="mt-2 text-vietnam-blue-600">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>
          <span className="text-sm text-vietnam-blue-600">
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Tiếp
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
