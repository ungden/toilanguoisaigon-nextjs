"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlogPosts } from "@/hooks/data/useBlogPosts";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { FALLBACK_IMAGES } from "@/utils/constants";
import { useState } from "react";

const CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "guide", label: "Hướng dẫn" },
  { value: "listicle", label: "Danh sách" },
  { value: "culture", label: "Văn hóa" },
  { value: "tip", label: "Mẹo hay" },
  { value: "review", label: "Review" },
];

const BlogPage = () => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const { data, isLoading } = useBlogPosts({ page, pageSize: 12, category });

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  return (
    <div className="flex flex-col bg-white">
      {/* Hero */}
      <section className="bg-vietnam-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Blog & Review
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Khám phá Sài Gòn qua những câu chuyện, góc nhìn và bài đánh giá chuyên sâu từ cộng đồng.
          </p>
          {totalCount > 0 && (
            <p className="text-white/70 mt-4">{totalCount} bài viết</p>
          )}
        </div>
      </section>

      <section className="container mx-auto py-8 px-4">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={category === cat.value
                ? "bg-vietnam-red-600 hover:bg-vietnam-red-700 text-white"
                : "border-vietnam-blue-300 text-vietnam-blue-700 hover:bg-vietnam-blue-50"
              }
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Posts grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="block group">
                <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full flex flex-col">
                  <div className="relative overflow-hidden">
                    <Image
                      src={post.cover_image_url || FALLBACK_IMAGES.collection}
                      alt={post.title}
                      className="aspect-[16/9] w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      width={500}
                      height={281}
                      loading="lazy"
                    />
                    {post.category && post.category !== 'guide' && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-vietnam-red-600/90 text-white text-xs border-none">
                          {CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="bg-white flex-grow pb-2">
                    <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-xl leading-tight line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-vietnam-blue-600 text-sm leading-relaxed mt-2 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.profiles?.avatar_url || undefined} />
                          <AvatarFallback>{post.profiles?.full_name?.[0] || 'A'}</AvatarFallback>
                        </Avatar>
                        <span>{post.profiles?.full_name || 'Admin'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {post.reading_time > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.reading_time} phút</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold text-vietnam-blue-800">Chưa có bài viết nào</h2>
            <p className="mt-2 text-muted-foreground">
              {category !== 'all'
                ? 'Không tìm thấy bài viết trong danh mục này. Hãy thử danh mục khác.'
                : 'Nội dung đang được cập nhật. Vui lòng quay lại sau.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="border-vietnam-blue-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum
                      ? "bg-vietnam-red-600 hover:bg-vietnam-red-700 text-white min-w-[36px]"
                      : "border-vietnam-blue-300 min-w-[36px]"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-vietnam-blue-300"
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogPage;
