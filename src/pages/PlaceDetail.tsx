import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, Phone, DollarSign, MessageSquare, UserCircle } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location, ReviewWithProfile } from '@/types/database';
import { formatPriceRange, formatOpeningHours } from "@/utils/formatters";

interface LocationWithReviews extends Location {
  reviews: ReviewWithProfile[];
}

const fetchLocationDetail = async (id: string): Promise<LocationWithReviews | null> => {
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      reviews (
        *,
        profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching location detail:', error);
    throw new Error(error.message);
  }

  return data;
};

const PlaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: place, isLoading, error } = useQuery<LocationWithReviews | null, Error>({
    queryKey: ['location-detail', id],
    queryFn: () => fetchLocationDetail(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy địa điểm</h1>
            <p className="text-vietnam-blue-600">Địa điểm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Button asChild variant="outline" className="mt-6 text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700">
              <Link to="/search">Quay lại tìm kiếm</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = [place.main_image_url, ...(place.gallery_urls || [])].filter(Boolean) as string[];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96 mb-8">
          <div className="col-span-2 row-span-2">
            <img 
              src={images[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'} 
              alt={place.name} 
              className="w-full h-full object-cover rounded-lg" 
            />
          </div>
          {images[1] && (
            <div className="col-span-1 row-span-1">
              <img src={images[1]} alt={place.name} className="w-full h-full object-cover rounded-lg" />
            </div>
          )}
          {images[2] && (
            <div className="col-span-1 row-span-1">
              <img src={images[2]} alt={place.name} className="w-full h-full object-cover rounded-lg" />
            </div>
          )}
          <div className="col-span-2 row-span-1">
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <Button variant="outline">Xem tất cả ảnh ({images.length})</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-vietnam-blue-800">{place.name}</h1>
            <div className="flex items-center text-lg text-vietnam-blue-600 my-2">
              {place.average_rating > 0 && (
                <>
                  <Star className="h-5 w-5 mr-1 fill-vietnam-gold-500 text-vietnam-gold-500" />
                  <span>{place.average_rating.toFixed(1)}</span>
                  <span className="mx-2">·</span>
                  <span>({place.review_count} đánh giá)</span>
                  <span className="mx-2">·</span>
                </>
              )}
              <Badge variant="secondary" className="bg-vietnam-red-100 text-vietnam-red-700">
                {place.district}
              </Badge>
            </div>
            
            <Separator className="my-6" />

            {/* Core Info */}
            <div className="space-y-4 text-lg">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                <span className="text-vietnam-blue-700">{place.address}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                <span className="text-vietnam-blue-700">{formatOpeningHours(place.opening_hours)}</span>
              </div>
              {place.phone_number && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                  <span className="text-vietnam-blue-700">{place.phone_number}</span>
                </div>
              )}
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                <span className="text-vietnam-blue-700">{formatPriceRange(place.price_range)}</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            {place.description && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-vietnam-red-600">Về địa điểm này</h2>
                <div className="prose prose-lg max-w-none text-vietnam-blue-700">
                  <p>{place.description}</p>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Community Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-vietnam-red-600">
                Đánh giá từ cộng đồng ({place.reviews.length})
              </h2>
              {place.reviews.length > 0 ? (
                <div className="space-y-6">
                  {place.reviews.map(review => (
                    <div key={review.id}>
                      <div className="flex items-center mb-2">
                        <UserCircle className="h-8 w-8 mr-2 text-vietnam-blue-600" />
                        <div>
                          <p className="font-semibold text-vietnam-blue-800">
                            {review.profiles?.full_name || 'Người dùng ẩn danh'}
                          </p>
                          <div className="flex items-center text-sm">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'fill-vietnam-gold-500 text-vietnam-gold-500' 
                                    : 'fill-gray-200 text-gray-200'
                                }`} 
                              />
                            ))}
                            <span className="ml-2 text-vietnam-blue-600">
                              {new Date(review.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-vietnam-blue-700 ml-10">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-vietnam-blue-600">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-vietnam-red-200">
              <CardHeader>
                <CardTitle className="text-vietnam-red-600">Thông tin thêm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-vietnam-blue-600 mb-4">
                  Bạn đã đến đây chưa? Chia sẻ trải nghiệm của bạn!
                </p>
                <Button className="w-full btn-vietnam mb-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Viết đánh giá
                </Button>
                <Button variant="outline" className="w-full border-vietnam-red-600 text-vietnam-red-600 hover:bg-vietnam-red-50">
                  Lưu vào sổ tay
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceDetailPage;