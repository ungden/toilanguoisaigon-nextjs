import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  DollarSign, 
  MessageSquare, 
  UserCircle, 
  ArrowLeft,
  Share2,
  Bookmark,
  Camera,
  Navigation,
  Wifi,
  Car,
  CreditCard,
  Users,
  Baby,
  Dog,
  Utensils,
  Coffee,
  Wine,
  Calendar,
  ThumbsUp,
  Flag,
  ExternalLink
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location, Review, ReviewWithProfile } from '@/types/database';
import { formatPriceRange, formatOpeningHours } from "@/utils/formatters";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface LocationWithReviews extends Location {
  reviews: ReviewWithProfile[];
  location_categories: { categories: { name: string; slug: string } }[];
  location_tags: { tags: { name: string; slug: string } }[];
}

const fetchLocationDetail = async (slug: string): Promise<LocationWithReviews | null> => {
  // Step 1: Fetch the core location data first.
  const { data: locationData, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', slug)
    .single();

  // If the location itself is not found, stop here.
  if (locationError || !locationData) {
    console.error('Error fetching location by slug:', locationError?.message);
    return null;
  }

  // Step 2: Fetch all related data in parallel. This is more robust than a single complex query.
  const [reviewsResult, categoriesResult, tagsResult] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('location_id', locationData.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('location_categories')
      .select('categories(name, slug)')
      .eq('location_id', locationData.id),
    supabase
      .from('location_tags')
      .select('tags(name, slug)')
      .eq('location_id', locationData.id)
  ]);

  // Log errors if any, but don't stop the process. This makes the query more resilient.
  if (reviewsResult.error) console.error('Error fetching reviews:', reviewsResult.error.message);
  if (categoriesResult.error) console.error('Error fetching categories:', categoriesResult.error.message);
  if (tagsResult.error) console.error('Error fetching tags:', tagsResult.error.message);

  // Step 3: Combine all the data into a single object for the UI.
  const combinedData: LocationWithReviews = {
    ...locationData,
    reviews: (reviewsResult.data as ReviewWithProfile[]) || [],
    location_categories: (categoriesResult.data as any[]) || [],
    location_tags: (tagsResult.data as any[]) || [],
  };

  return combinedData;
};

const fetchSimilarLocations = async (district: string, currentId: string): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('district', district)
    .eq('status', 'published')
    .neq('id', currentId)
    .limit(4);

  if (error) {
    console.error('Error fetching similar locations:', error);
    return [];
  }

  return data || [];
};

const PlaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSort, setReviewSort] = useState('newest');
  
  const { data: place, isLoading, error } = useQuery<LocationWithReviews | null, Error>({
    queryKey: ['location-detail', slug],
    queryFn: () => fetchLocationDetail(slug!),
    enabled: !!slug,
    retry: 1,
  });

  const { data: similarPlaces } = useQuery<Location[], Error>({
    queryKey: ['similar-locations', place?.district, place?.id],
    queryFn: () => fetchSimilarLocations(place!.district, place!.id),
    enabled: !!place?.district && !!place?.id,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user || !place) throw new Error('User not authenticated or place not found');
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          location_id: place.id,
          user_id: user.id,
          rating,
          comment: comment.trim() || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Đánh giá của bạn đã được gửi thành công!');
      setReviewText('');
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['location-detail', slug] });
    },
    onError: (error) => {
      console.error('Error submitting review:', error);
      showError('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
    }
  });

  useEffect(() => {
    if (error) {
      console.error('Error loading location detail:', error);
      showError('Không thể tải thông tin địa điểm. Vui lòng thử lại sau.');
    }
  }, [error]);

  const handleSubmitReview = () => {
    if (!user) {
      showError('Vui lòng đăng nhập để viết đánh giá.');
      return;
    }
    
    if (reviewText.trim().length < 10) {
      showError('Đánh giá phải có ít nhất 10 ký tự.');
      return;
    }

    submitReviewMutation.mutate({
      rating: reviewRating,
      comment: reviewText
    });
  };

  const handleShare = async () => {
    if (navigator.share && place) {
      try {
        await navigator.share({
          title: place.name,
          text: `Khám phá ${place.name} tại ${place.address}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Đã sao chép liên kết!');
    }
  };

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
            <p className="text-vietnam-blue-600 mb-8">Địa điểm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Button asChild variant="outline" className="text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700">
              <Link to="/search">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại tìm kiếm
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = [place.main_image_url, ...(place.gallery_urls || [])].filter(Boolean) as string[];
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop');
  }

  const categories = place.location_categories?.map(lc => lc.categories) || [];
  const tags = place.location_tags?.map(lt => lt.tags) || [];
  
  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = place.reviews?.filter(r => r.rating === rating).length || 0;
    const percentage = place.review_count > 0 ? (count / place.review_count) * 100 : 0;
    return { rating, count, percentage };
  });

  // Sort reviews
  const sortedReviews = [...(place.reviews || [])].sort((a, b) => {
    if (reviewSort === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (reviewSort === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (reviewSort === 'highest') {
      return b.rating - a.rating;
    } else if (reviewSort === 'lowest') {
      return a.rating - b.rating;
    }
    return 0;
  });

  const openingHoursData = place.opening_hours as any;
  const daysOfWeek = [
    { key: 'monday', label: 'Thứ 2' },
    { key: 'tuesday', label: 'Thứ 3' },
    { key: 'wednesday', label: 'Thứ 4' },
    { key: 'thursday', label: 'Thứ 5' },
    { key: 'friday', label: 'Thứ 6' },
    { key: 'saturday', label: 'Thứ 7' },
    { key: 'sunday', label: 'Chủ nhật' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-4 text-vietnam-blue-600 hover:text-vietnam-red-600 hover:bg-vietnam-red-50 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-64 md:h-96 mb-8">
          <div className="col-span-1 md:col-span-2 row-span-2">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  <img 
                    src={images[selectedImage]} 
                    alt={place.name} 
                    className="w-full h-full object-cover rounded-lg group-hover:brightness-90 transition-all" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{place.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center">
                  <img 
                    src={images[selectedImage]} 
                    alt={place.name} 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg" 
                  />
                  <div className="flex gap-2 mt-4 overflow-x-auto">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${place.name} ${index + 1}`}
                        className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                          selectedImage === index ? 'border-vietnam-red-600' : 'border-transparent'
                        }`}
                        onClick={() => setSelectedImage(index)}
                      />
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {images.length > 1 && (
            <div className="col-span-1 row-span-1">
              <img 
                src={images[1]} 
                alt={place.name} 
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all" 
                onClick={() => setSelectedImage(1)}
              />
            </div>
          )}
          {images.length > 2 && (
            <div className="col-span-1 row-span-1">
              <img 
                src={images[2]} 
                alt={place.name} 
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all" 
                onClick={() => setSelectedImage(2)}
              />
            </div>
          )}
          <div className="col-span-1 md:col-span-2 row-span-1">
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Xem tất cả ảnh ({images.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Thư viện ảnh - {place.name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${place.name} ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all"
                        onClick={() => setSelectedImage(index)}
                      />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex-grow">
                <h1 className="text-4xl font-bold text-vietnam-blue-800 mb-2">{place.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-lg text-vietnam-blue-600 mb-4">
                  {place.average_rating > 0 && (
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-1 fill-vietnam-gold-500 text-vietnam-gold-500" />
                      <span className="font-semibold">{place.average_rating.toFixed(1)}</span>
                      <span className="mx-2">·</span>
                      <span>({place.review_count} đánh giá)</span>
                    </div>
                  )}
                  <Badge variant="secondary" className="bg-vietnam-red-100 text-vietnam-red-700">
                    {place.district}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
              </div>
            </div>

            {/* Categories and Tags */}
            {(categories.length > 0 || tags.length > 0) && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge key={category.slug} variant="secondary" className="bg-vietnam-blue-100 text-vietnam-blue-700">
                      <Utensils className="h-3 w-3 mr-1" />
                      {category.name}
                    </Badge>
                  ))}
                  {tags.map((tag) => (
                    <Badge key={tag.slug} variant="outline" className="border-vietnam-red-300 text-vietnam-red-600">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Separator className="my-6" />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá ({place.review_count})</TabsTrigger>
                <TabsTrigger value="hours">Giờ mở cửa</TabsTrigger>
                <TabsTrigger value="location">Vị trí</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Core Info */}
                <div className="space-y-4 text-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                    <span className="text-vietnam-blue-700">{place.address}</span>
                    <Button variant="ghost" size="sm" className="ml-2 text-vietnam-blue-600 hover:text-vietnam-red-600">
                      <Navigation className="h-4 w-4 mr-1" />
                      Chỉ đường
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                    <span className="text-vietnam-blue-700">{formatOpeningHours(place.opening_hours)}</span>
                  </div>
                  {place.phone_number && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                      <span className="text-vietnam-blue-700">{place.phone_number}</span>
                      <Button variant="ghost" size="sm" className="ml-2 text-vietnam-blue-600 hover:text-vietnam-red-600">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Gọi
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> 
                    <span className="text-vietnam-blue-700">{formatPriceRange(place.price_range)}</span>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Tiện ích</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-vietnam-blue-700">
                      <Wifi className="h-4 w-4 mr-2 text-vietnam-red-600" />
                      <span>WiFi miễn phí</span>
                    </div>
                    <div className="flex items-center text-vietnam-blue-700">
                      <Car className="h-4 w-4 mr-2 text-vietnam-red-600" />
                      <span>Chỗ đậu xe</span>
                    </div>
                    <div className="flex items-center text-vietnam-blue-700">
                      <CreditCard className="h-4 w-4 mr-2 text-vietnam-red-600" />
                      <span>Thanh toán thẻ</span>
                    </div>
                    <div className="flex items-center text-vietnam-blue-700">
                      <Users className="h-4 w-4 mr-2 text-vietnam-red-600" />
                      <span>Phù hợp nhóm</span>
                    </div>
                    <div className="flex items-center text-vietnam-blue-700">
                      <Baby className="h-4 w-4 mr-2 text-vietnam-red-600" />
                      <span>Thân thiện trẻ em</span>
                    </div>
                    <div className="flex items-center text-vietnam-blue-700">
                      <Dog className="h-4 w-4 mr-2 text-vietnam-red-600" />
                      <span>Cho phép thú cưng</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {place.description && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Về địa điểm này</h3>
                    <div className="prose prose-lg max-w-none text-vietnam-blue-700">
                      <p className="leading-relaxed">{place.description}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {/* Rating Overview */}
                {place.review_count > 0 && (
                  <Card className="border-vietnam-red-200">
                    <CardHeader>
                      <CardTitle className="text-vietnam-red-600">Tổng quan đánh giá</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-vietnam-blue-800 mb-2">
                            {place.average_rating.toFixed(1)}
                          </div>
                          <div className="flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-5 w-5 ${
                                  i < Math.round(place.average_rating) 
                                    ? 'fill-vietnam-gold-500 text-vietnam-gold-500' 
                                    : 'fill-gray-200 text-gray-200'
                                }`} 
                              />
                            ))}
                          </div>
                          <p className="text-vietnam-blue-600">{place.review_count} đánh giá</p>
                        </div>
                        <div className="space-y-2">
                          {ratingDistribution.map(({ rating, count, percentage }) => (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-sm w-8">{rating} ⭐</span>
                              <Progress value={percentage} className="flex-1 h-2" />
                              <span className="text-sm text-vietnam-blue-600 w-8">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Write Review */}
                {user && (
                  <Card className="border-vietnam-red-200">
                    <CardHeader>
                      <CardTitle className="text-vietnam-red-600">Viết đánh giá</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-vietnam-blue-800 mb-2 block">
                          Đánh giá của bạn
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 cursor-pointer transition-colors ${
                                star <= reviewRating
                                  ? 'fill-vietnam-gold-500 text-vietnam-gold-500'
                                  : 'fill-gray-200 text-gray-200 hover:fill-vietnam-gold-300 hover:text-vietnam-gold-300'
                              }`}
                              onClick={() => setReviewRating(star)}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-vietnam-blue-800 mb-2 block">
                          Chia sẻ trải nghiệm của bạn
                        </label>
                        <Textarea
                          placeholder="Hãy chia sẻ những gì bạn thích về địa điểm này..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitReview}
                        disabled={submitReviewMutation.isPending || reviewText.trim().length < 10}
                        className="btn-vietnam"
                      >
                        {submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-vietnam-red-600">
                      Đánh giá từ cộng đồng
                    </h3>
                    <Select value={reviewSort} onValueChange={setReviewSort}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                        <SelectItem value="highest">Điểm cao nhất</SelectItem>
                        <SelectItem value="lowest">Điểm thấp nhất</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sortedReviews.length > 0 ? (
                    <div className="space-y-6">
                      {sortedReviews.map(review => (
                        <Card key={review.id} className="border-vietnam-red-100">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.profiles?.avatar_url} />
                                <AvatarFallback className="bg-vietnam-red-100 text-vietnam-red-700">
                                  {review.profiles?.full_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-semibold text-vietnam-blue-800">
                                      {review.profiles?.full_name || 'Người dùng ẩn danh'}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-vietnam-blue-600">
                                      <div className="flex">
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
                                      </div>
                                      <span>·</span>
                                      <span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm">
                                      <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Flag className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {review.comment && (
                                  <p className="text-vietnam-blue-700 leading-relaxed">{review.comment}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-vietnam-blue-300 mx-auto mb-4" />
                      <p className="text-vietnam-blue-600">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="hours" className="space-y-4">
                <Card className="border-vietnam-red-200">
                  <CardHeader>
                    <CardTitle className="text-vietnam-red-600 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Giờ mở cửa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {daysOfWeek.map(({ key, label }) => {
                        const hours = openingHoursData?.[key] || 'Đóng cửa';
                        const isToday = new Date().getDay() === (key === 'sunday' ? 0 : daysOfWeek.findIndex(d => d.key === key) + 1);
                        
                        return (
                          <div key={key} className={`flex justify-between items-center py-2 px-3 rounded ${
                            isToday ? 'bg-vietnam-red-50 border border-vietnam-red-200' : ''
                          }`}>
                            <span className={`font-medium ${
                              isToday ? 'text-vietnam-red-700' : 'text-vietnam-blue-800'
                            }`}>
                              {label}
                              {isToday && <span className="ml-2 text-xs">(Hôm nay)</span>}
                            </span>
                            <span className={`${
                              isToday ? 'text-vietnam-red-600 font-semibold' : 'text-vietnam-blue-600'
                            }`}>
                              {hours}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <Card className="border-vietnam-red-200">
                  <CardHeader>
                    <CardTitle className="text-vietnam-red-600 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Vị trí và liên hệ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Bản đồ sẽ được tích hợp ở đây</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-vietnam-blue-700">
                        <strong>Địa chỉ:</strong> {place.address}
                      </p>
                      <p className="text-vietnam-blue-700">
                        <strong>Quận/Huyện:</strong> {place.district}
                      </p>
                      {place.phone_number && (
                        <p className="text-vietnam-blue-700">
                          <strong>Điện thoại:</strong> {place.phone_number}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button className="btn-vietnam">
                        <Navigation className="h-4 w-4 mr-2" />
                        Chỉ đường
                      </Button>
                      <Button variant="outline" className="border-vietnam-red-600 text-vietnam-red-600 hover:bg-vietnam-red-50">
                        <Phone className="h-4 w-4 mr-2" />
                        Gọi điện
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Quick Actions */}
              <Card className="border-vietnam-red-200">
                <CardHeader>
                  <CardTitle className="text-vietnam-red-600">Hành động nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user ? (
                    <Button className="w-full btn-vietnam">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Viết đánh giá
                    </Button>
                  ) : (
                    <Button asChild className="w-full btn-vietnam">
                      <Link to="/login">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Đăng nhập để đánh giá
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full border-vietnam-red-600 text-vietnam-red-600 hover:bg-vietnam-red-50">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Lưu vào sổ tay
                  </Button>
                  <Button variant="outline" className="w-full border-vietnam-blue-600 text-vietnam-blue-600 hover:bg-vietnam-blue-50" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ
                  </Button>
                </CardContent>
              </Card>

              {/* Similar Places */}
              {similarPlaces && similarPlaces.length > 0 && (
                <Card className="border-vietnam-red-200">
                  <CardHeader>
                    <CardTitle className="text-vietnam-red-600">Địa điểm tương tự</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {similarPlaces.map((similarPlace) => (
                      <Link 
                        key={similarPlace.id} 
                        to={`/place/${similarPlace.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3 p-2 rounded-lg hover:bg-vietnam-red-50 transition-colors">
                          <img 
                            src={similarPlace.main_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'} 
                            alt={similarPlace.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors truncate">
                              {similarPlace.name}
                            </h4>
                            <p className="text-sm text-vietnam-blue-600 truncate">{similarPlace.district}</p>
                            {similarPlace.average_rating > 0 && (
                              <div className="flex items-center text-xs text-vietnam-blue-600">
                                <Star className="h-3 w-3 fill-vietnam-gold-500 text-vietnam-gold-500 mr-1" />
                                {similarPlace.average_rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceDetailPage;