"use client";

import { usePublicProfile, usePublicUserReviews, usePublicUserCollections } from "@/src/hooks/data/usePublicProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Star, MapPin, CheckCircle2, MessageSquare, FolderHeart, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from "next/image";
import { FALLBACK_IMAGES } from "@/utils/constants";
import { useParams } from "next/navigation";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const { data: profile, isLoading: loadingProfile } = usePublicProfile(userId);
  const { data: reviews, isLoading: loadingReviews } = usePublicUserReviews(userId);
  const { data: collections, isLoading: loadingCollections } = usePublicUserCollections(userId);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  if (loadingProfile) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-vietnam-red-500 mb-4" />
        <p className="text-muted-foreground">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy người dùng</h2>
        <p className="text-muted-foreground">Hồ sơ này không tồn tại hoặc đã bị xóa.</p>
        <Link href="/" className="text-vietnam-red-600 hover:underline mt-4 inline-block">Về trang chủ</Link>
      </div>
    );
  }

  const displayName = profile.display_name || profile.full_name || "Thành viên ẩn danh";
  const isVerified = profile.level >= 10;
  const joinDate = new Date(profile.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });

  return (
    <div className="container py-12 max-w-5xl">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-vietnam-red-100 shadow-sm p-6 sm:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-vietnam-red-500 to-orange-400 opacity-90 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-[url('/hero-pattern.png')] bg-repeat opacity-20 z-0"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 mt-12 sm:mt-16">
          <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-white shadow-lg bg-white">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} className="object-cover" />
            <AvatarFallback className="text-4xl bg-vietnam-red-100 text-vietnam-red-700 font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <h1 className="text-3xl font-bold text-vietnam-blue-900 flex items-center justify-center sm:justify-start gap-2">
                {displayName}
                {isVerified && (
                  <CheckCircle2 className="h-6 w-6 text-blue-500 fill-blue-100" aria-label="Verified User" />
                )}
              </h1>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 self-center">
                Lv {profile.level || 1}
              </Badge>
            </div>
            
            <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mb-4">
              <Calendar className="h-4 w-4" />
              Thành viên từ {joinDate}
            </p>
            
            {profile.bio && (
              <p className="text-gray-700 max-w-2xl bg-gray-50 p-3 rounded-lg italic">"{profile.bio}"</p>
            )}
          </div>
          
          <div className="flex flex-col items-center sm:items-end bg-vietnam-red-50 rounded-xl p-4 min-w-[140px] shadow-inner border border-vietnam-red-100">
            <span className="text-sm font-semibold text-vietnam-red-700 uppercase tracking-wider mb-1">Tổng XP</span>
            <div className="flex items-center text-3xl font-black text-vietnam-gold-600">
              {profile.xp.toLocaleString('vi-VN')}
              <Star className="h-6 w-6 ml-1.5 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-8 overflow-x-auto">
          <TabsTrigger 
            value="reviews" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-vietnam-red-600 data-[state=active]:text-vietnam-red-600 data-[state=active]:bg-transparent rounded-none px-6 py-3 text-base font-medium"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Đánh giá ({reviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="collections" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-vietnam-red-600 data-[state=active]:text-vietnam-red-600 data-[state=active]:bg-transparent rounded-none px-6 py-3 text-base font-medium"
          >
            <FolderHeart className="h-4 w-4 mr-2" />
            Bộ sưu tập ({collections?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="focus-visible:outline-none">
          {loadingReviews ? (
             <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">Chưa có đánh giá nào</h3>
              <p className="text-gray-400">Người dùng này chưa viết review nào cho các địa điểm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <Card key={review.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gray-50/50 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base text-vietnam-blue-800 line-clamp-1 hover:text-vietnam-red-600 transition-colors">
                          {review.locations ? (
                            <Link href={`/place/${review.locations.slug}`}>{review.locations.name}</Link>
                          ) : "Địa điểm đã xóa"}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: vi })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                        <span className="font-bold text-yellow-700 mr-1">{review.rating}</span>
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {review.comment ? (
                      <p className="text-gray-700 text-sm line-clamp-4">{review.comment}</p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Chỉ để lại điểm đánh giá, không có bình luận.</p>
                    )}
                    {review.image_urls && review.image_urls.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-hidden h-16">
                        {review.image_urls.slice(0, 4).map((url, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            <Image src={url} alt="Review photo" fill className="object-cover" />
                          </div>
                        ))}
                        {review.image_urls.length > 4 && (
                          <div className="flex items-center justify-center w-16 h-16 rounded-md bg-gray-100 text-xs font-medium text-gray-500 border border-gray-200 flex-shrink-0">
                            +{review.image_urls.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="collections" className="focus-visible:outline-none">
          {loadingCollections ? (
             <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : !collections || collections.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FolderHeart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">Chưa có bộ sưu tập công khai</h3>
              <p className="text-gray-400">Người dùng này chưa tạo bộ sưu tập nào hoặc đang để ở chế độ riêng tư.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => (
                <Link key={col.id} href={`/collection/${col.slug}`} className="group block">
                  <Card className="overflow-hidden h-full hover:shadow-md transition-all border-gray-200 hover:border-vietnam-red-200">
                    <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                      <Image 
                        src={col.cover_image_url || FALLBACK_IMAGES.collection} 
                        alt={col.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <Badge className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border-0 mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          {col.location_count || 0} địa điểm
                        </Badge>
                        <h3 className="font-bold text-lg line-clamp-1">{col.title}</h3>
                      </div>
                    </div>
                    {col.description && (
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{col.description}</p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
