"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile, ReviewWithProfileAndLocation } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const fetchPublicProfile = async (userId: string) => {
  const [profileResult, reviewsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, display_name, avatar_url, bio, xp, level, created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("reviews")
      .select(`*, locations!inner(name, slug, district)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error) return null;

  return {
    profile: profileResult.data as Profile,
    reviews: (reviewsResult.data as ReviewWithProfileAndLocation[]) || [],
  };
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: () => fetchPublicProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-80 h-64" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy người dùng</h1>
        <Button asChild variant="outline">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Về trang chủ</Link>
        </Button>
      </div>
    );
  }

  const { profile, reviews } = data;
  const displayName = profile.display_name || profile.full_name || "Ẩn danh";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Card */}
        <Card className="w-full md:w-80 md:sticky top-24 h-fit">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-vietnam-red-100 text-vietnam-red-700">
                {displayName[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{displayName}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-vietnam-gold-100 text-vietnam-gold-800">
                Level {profile.level}
              </Badge>
              <Badge variant="outline" className="text-vietnam-blue-600">
                {profile.xp} XP
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            {profile.bio && (
              <p className="text-sm text-slate-600">{profile.bio}</p>
            )}
            <div className="flex justify-center gap-4 text-sm text-slate-500">
              <div className="text-center">
                <div className="font-bold text-vietnam-blue-800">{reviews.length}</div>
                <div>đánh giá</div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Tham gia từ {new Date(profile.created_at).toLocaleDateString("vi-VN")}
            </p>
          </CardContent>
        </Card>

        {/* Reviews */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-vietnam-blue-800 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-vietnam-red-600" />
            Đánh giá của {displayName}
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => {
                const loc = review.locations as unknown as { name: string; slug: string; district: string } | null;
                return (
                  <Card key={review.id} className="border-vietnam-blue-100">
                    <CardContent className="p-5">
                      <Link href={`/place/${loc?.slug}`} className="group">
                        <h3 className="font-bold text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors">
                          {loc?.name}
                        </h3>
                        {loc?.district && (
                          <div className="flex items-center text-xs text-slate-500 mt-0.5">
                            <MapPin className="h-3 w-3 mr-1" />
                            {loc.district}
                          </div>
                        )}
                      </Link>
                      <div className="flex items-center gap-1 mt-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-vietnam-gold-500 text-vietnam-gold-500" : "fill-gray-200 text-gray-200"}`}
                          />
                        ))}
                        <span className="text-xs text-slate-400 ml-2">
                          {new Date(review.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-vietnam-blue-700 leading-relaxed">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-slate-500">{displayName} chưa có đánh giá nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
