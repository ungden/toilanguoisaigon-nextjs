"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePost } from "@/hooks/data/usePost";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ArrowLeft, Clock, MapPin, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { sanitizeHtml } from "@/utils/sanitize";
import { FALLBACK_IMAGES } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function SafeBlogContent({ content }: { content: string }) {
  const sanitized = useMemo(() => sanitizeHtml(content), [content]);
  return (
    <div
      className="prose prose-lg max-w-none prose-p:text-vietnam-blue-800 prose-headings:text-vietnam-red-600 prose-a:text-vietnam-red-600 hover:prose-a:text-vietnam-red-700 prose-strong:text-vietnam-blue-900 prose-li:text-vietnam-blue-800"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/** Inline hook to fetch related locations by slug array */
function useRelatedLocations(slugs: string[]) {
  return useQuery({
    queryKey: ['related-locations', slugs],
    queryFn: async () => {
      if (!slugs.length) return [];
      const { data } = await supabase
        .from('locations')
        .select('name, slug, district, main_image_url, google_rating, price_range')
        .in('slug', slugs.slice(0, 8))
        .eq('status', 'published');
      return data || [];
    },
    enabled: slugs.length > 0,
    staleTime: 1000 * 60 * 10,
  });
}

const PostDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: post, isLoading, error } = usePost(slug!);
  const { data: relatedLocations } = useRelatedLocations(post?.related_location_slugs || []);

  if (isLoading) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="aspect-[16/9] w-full rounded-lg mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy bài viết</h1>
          <p className="text-vietnam-blue-600 mb-8">Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <Button asChild variant="outline" className="text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại trang Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 text-vietnam-blue-600 hover:text-vietnam-red-600 hover:bg-vietnam-red-50 -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <article>
            <header className="mb-8">
              <h1 className="text-3xl md:text-5xl font-bold text-vietnam-blue-800 mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{post.profiles?.full_name?.[0] || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{post.profiles?.full_name || 'Tôi Là Người Sài Gòn'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                {post.reading_time > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.reading_time} phút đọc</span>
                  </div>
                )}
              </div>
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs text-vietnam-blue-600 border-vietnam-blue-200">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </header>

            <Image
              src={post.cover_image_url || FALLBACK_IMAGES.collection}
              alt={post.title}
              className="w-full aspect-video object-cover rounded-lg mb-8 shadow-lg"
              width={896}
              height={504}
              priority
            />

            <SafeBlogContent content={post.content || ''} />
          </article>

          {/* Related Locations */}
          {relatedLocations && relatedLocations.length > 0 && (
            <section className="mt-12 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-vietnam-blue-800 mb-6 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-vietnam-red-500" />
                Địa điểm trong bài viết
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedLocations.map((loc) => (
                  <Link href={`/place/${loc.slug}`} key={loc.slug} className="block group">
                    <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={loc.main_image_url || FALLBACK_IMAGES.location}
                          alt={loc.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          {loc.google_rating && (
                            <Badge className="bg-vietnam-gold-500/90 text-white text-[10px] border-none">
                              ★ {loc.google_rating}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors line-clamp-1">
                          {loc.name}
                        </h3>
                        <p className="text-xs text-vietnam-blue-600 mt-1">{loc.district}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to blog */}
          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <Button asChild variant="outline" className="text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700">
              <Link href="/blog">
                Xem tất cả bài viết
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
