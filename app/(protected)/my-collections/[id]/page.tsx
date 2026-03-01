"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRemoveFromCollection } from "@/hooks/data/useUserCollections";
import { UserCollectionWithLocations, Location } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MapPin, Star, Trash2, Globe, Lock, DollarSign } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { getCategoryArtwork } from "@/utils/constants";
import { formatPriceRange } from "@/utils/formatters";

type LocationPick = Pick<
  Location,
  'id' | 'name' | 'slug' | 'address' | 'district' | 'main_image_url' | 'average_rating' | 'review_count' | 'price_range'
>;

const fetchCollectionDetail = async (
  collectionId: string,
  userId: string
): Promise<UserCollectionWithLocations | null> => {
  const { data, error } = await supabase
    .from("user_collections")
    .select(
      `*, user_collection_locations(id, collection_id, location_id, position, note, added_at, locations(id, name, slug, address, district, main_image_url, average_rating, review_count, price_range))`
    )
    .eq("id", collectionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as unknown as UserCollectionWithLocations;
};

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const removeFromCollection = useRemoveFromCollection();

  const {
    data: collection,
    isLoading,
  } = useQuery({
    queryKey: ["user-collection-detail", id, user?.id],
    queryFn: () => fetchCollectionDetail(id!, user!.id),
    enabled: !!id && !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">
          Không tìm thấy bộ sưu tập
        </h1>
        <p className="text-vietnam-blue-600 mb-6">
          Bộ sưu tập này không tồn tại hoặc không thuộc về bạn.
        </p>
        <Button variant="outline" onClick={() => router.push("/my-collections")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const locations = collection.user_collection_locations || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4 text-vietnam-blue-600 hover:text-vietnam-red-600 -ml-2"
        onClick={() => router.push("/my-collections")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Bộ sưu tập của tôi
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-vietnam-blue-800">
            {collection.title}
          </h1>
          <Badge
            variant="outline"
            className={
              collection.is_public
                ? "border-green-300 text-green-700"
                : "border-slate-300 text-slate-600"
            }
          >
            {collection.is_public ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Công khai
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Riêng tư
              </>
            )}
          </Badge>
        </div>
        {collection.description && (
          <p className="text-vietnam-blue-600">{collection.description}</p>
        )}
        <p className="text-sm text-slate-500 mt-1">
          {locations.length} địa điểm
        </p>
      </div>

      {/* Locations list */}
      {locations.length > 0 ? (
        <div className="space-y-4">
          {locations.map((item) => {
            const loc = item.locations as unknown as LocationPick;
            if (!loc) return null;

            const imagePath = loc.main_image_url
              ? getPathFromSupabaseUrl(loc.main_image_url)
              : null;
            const imageUrl = imagePath
              ? getTransformedImageUrl(imagePath, {
                  width: 200,
                  height: 200,
                  resize: "cover",
                })
              : getCategoryArtwork(loc.name);

            return (
              <Card
                key={item.id}
                className="border-vietnam-blue-100 hover:border-vietnam-red-200 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link
                      href={`/place/${loc.slug}`}
                      className="flex-shrink-0"
                    >
                      <Image
                        src={imageUrl}
                        alt={loc.name}
                        width={100}
                        height={100}
                        className="rounded-lg object-cover w-24 h-24"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/place/${loc.slug}`}
                        className="group"
                      >
                        <h3 className="font-bold text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg">
                          {loc.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-vietnam-blue-600 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-vietnam-red-500" />
                        <span>{loc.district}</span>
                        {loc.average_rating > 0 && (
                          <>
                            <span className="text-slate-300">|</span>
                            <Star className="h-3.5 w-3.5 fill-vietnam-gold-500 text-vietnam-gold-500" />
                            <span>
                              {loc.average_rating.toFixed(1)} ({loc.review_count})
                            </span>
                          </>
                        )}
                        {loc.price_range && (
                          <>
                            <span className="text-slate-300">|</span>
                            <DollarSign className="h-3.5 w-3.5 text-vietnam-red-500" />
                            <span>{formatPriceRange(loc.price_range)}</span>
                          </>
                        )}
                      </div>
                      {loc.address && (
                        <p className="text-sm text-slate-500 mt-1 truncate">
                          {loc.address}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-sm text-vietnam-blue-600 italic mt-1">
                          {item.note}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    <div className="flex-shrink-0 self-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Xóa khỏi bộ sưu tập?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa &ldquo;{loc.name}&rdquo;
                              khỏi bộ sưu tập này?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() =>
                                removeFromCollection.mutate({
                                  collectionId: collection.id,
                                  locationId: loc.id,
                                })
                              }
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <MapPin className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-vietnam-blue-800">
            Chưa có địa điểm nào
          </h2>
          <p className="mt-2 text-vietnam-blue-600 mb-6">
            Thêm địa điểm vào bộ sưu tập từ trang chi tiết địa điểm.
          </p>
          <Button asChild className="btn-vietnam">
            <Link href="/search">Khám phá địa điểm</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
