"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Star, 
  MapPin, 
  Clock, 
  
  DollarSign, 
  MessageSquare, 
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
  ThumbsUp,
  ThumbsDown,
  Info,
  ChevronsUpDown,
  Quote,
  Sparkles
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location, ReviewWithProfile, ReviewInsights } from '@/types/database';
import { formatPriceRange, cleanReviewSummary } from "@/utils/formatters";
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
import { useSaveLocation } from "@/hooks/data/useSaveLocation";
import { useUnsaveLocation } from "@/hooks/data/useUnsaveLocation";
import { useAwardXp } from "@/hooks/data/useAwardXp";
import { useBadgeEvaluator } from "@/hooks/data/useBadgeEvaluator";
import { useLikeReview, useUnlikeReview } from "@/hooks/data/useReviewLikes";
import { useUserCollections, useAddToCollection, useCreateUserCollection } from "@/hooks/data/useUserCollections";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { FolderPlus, Plus, Check, Heart } from "lucide-react";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";
import { getCategoryArtwork, ARTWORK_MESSAGE } from "@/utils/constants";
import { calculateDistance, formatDistance } from "@/utils/geo";
import dynamic from 'next/dynamic';
import { toast } from "sonner";

const PlaceMap = dynamic(() => import('@/components/map/PlaceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-100 animate-pulse rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400">
      <MapPin className="h-8 w-8 mb-2 opacity-50" />
      <span>Đang tải bản đồ...</span>
    </div>
  )
});

interface LocationWithReviews extends Location {
  reviews: ReviewWithProfile[];
  location_categories: { categories: { name: string; slug: string } }[];
  location_tags: { tags: { name: string; slug: string } }[];
}

const fetchLocationDetail = async (slug: string, userId?: string): Promise<LocationWithReviews | null> => {
  const { data: locationData, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (locationError || !locationData) {
    return null;
  }

  const [reviewsResult, categoriesResult, tagsResult] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, profiles!fk_reviews_user_profile(full_name, avatar_url)')
      .eq('location_id', locationData.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('location_categories')
      .select('categories(name, slug)')
      .eq('location_id', locationData.id),
    supabase
      .from('location_tags')
      .select('tags(name, slug)')
      .eq('location_id', locationData.id),
  ]);

  // Only check saved status if user is logged in
  let isSaved = false;
  if (userId) {
    const { data: savedData } = await supabase
      .from('saved_locations')
      .select('user_id')
      .eq('location_id', locationData.id)
      .eq('user_id', userId)
      .single();
    isSaved = !!savedData;
  }

  const combinedData: LocationWithReviews = {
    ...locationData,
    reviews: (reviewsResult.data as ReviewWithProfile[]) || [],
    location_categories: (categoriesResult.data as unknown as { categories: { name: string; slug: string } }[]) || [],
    location_tags: (tagsResult.data as unknown as { tags: { name: string; slug: string } }[]) || [],
    isSaved
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
    return [];
  }

  return data || [];
};

const PlaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [reviewPhotosPreviews, setReviewPhotosPreviews] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (_error) => {
        setIsLocating(false);
        const errorMsg = "Không thể xác định được vị trí của bạn.";
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Reset selectedImageIndex when navigating to a different place
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [slug]);
  
  const { data: place, isLoading, error } = useQuery<LocationWithReviews | null, Error>({
    queryKey: ['location-detail', slug, user?.id],
    queryFn: () => fetchLocationDetail(slug!, user?.id),
    enabled: !!slug,
    retry: 1,
  });

  const { data: similarPlaces } = useQuery<Location[], Error>({
    queryKey: ['similar-locations', place?.district, place?.id],
    queryFn: () => fetchSimilarLocations(place!.district, place!.id),
    enabled: !!place?.district && !!place?.id,
  });

  const saveLocationMutation = useSaveLocation();
  const unsaveLocationMutation = useUnsaveLocation();
  const awardXpMutation = useAwardXp();
  const evaluateBadges = useBadgeEvaluator();
  const likeReview = useLikeReview();
  const unlikeReview = useUnlikeReview();
  const { data: userCollections } = useUserCollections(user?.id);
  const addToCollection = useAddToCollection();
  const createCollection = useCreateUserCollection();

  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [collectionPopoverOpen, setCollectionPopoverOpen] = useState(false);

  // Fetch which reviews the current user has liked
  useEffect(() => {
    if (!user || !place) return;
    const fetchLikes = async () => {
      const reviewIds = place.reviews.map(r => r.id);
      if (reviewIds.length === 0) return;
      const { data } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', user.id)
        .in('review_id', reviewIds);
      if (data) {
        setLikedReviews(new Set(data.map(d => d.review_id)));
      }
    };
    fetchLikes();
  }, [user, place]);

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

  const handleAddToCollection = (collectionId: string) => {
    if (!place) return;
    addToCollection.mutate({ collectionId, locationId: place.id });
  };

  const handleCreateAndAdd = () => {
    if (!user || !place || !newCollectionTitle.trim()) return;
    createCollection.mutate(
      { userId: user.id, data: { title: newCollectionTitle.trim() } },
      {
        onSuccess: (result) => {
          if (result?.id) {
            addToCollection.mutate({ collectionId: result.id, locationId: place.id });
          }
          setNewCollectionTitle('');
        },
      }
    );
  };

  const uploadReviewPhotos = async (files: File[], userId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('review-images').getPublicUrl(path);
      urls.push(publicData.publicUrl);
    }
    return urls;
  };

  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment, photos }: { rating: number; comment: string; photos: File[] }) => {
      if (!user || !place) throw new Error('User not authenticated or place not found');
      
      // Check for duplicate review
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('location_id', place.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReview) {
        throw new Error('DUPLICATE_REVIEW');
      }

      // Upload photos if any
      let imageUrls: string[] = [];
      if (photos.length > 0) {
        setIsUploadingPhotos(true);
        imageUrls = await uploadReviewPhotos(photos, user.id);
        setIsUploadingPhotos(false);
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          location_id: place.id,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
          image_urls: imageUrls,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Đánh giá của bạn đã được gửi thành công! +25 XP');
      setReviewText('');
      setReviewRating(5);
      // Clean up photo previews
      reviewPhotosPreviews.forEach(url => URL.revokeObjectURL(url));
      setReviewPhotos([]);
      setReviewPhotosPreviews([]);
      queryClient.invalidateQueries({ queryKey: ['location-detail', slug] });
      // Award XP for creating review
      if (user) {
        awardXpMutation.mutate(
          { userId: user.id, actionName: 'CREATE_REVIEW', metadata: { location_slug: slug } },
          { onSuccess: () => evaluateBadges.mutate(user.id) }
        );
      }
    },
    onError: (error: Error) => {
      setIsUploadingPhotos(false);
      if (error.message === 'DUPLICATE_REVIEW') {
        showError('Bạn đã đánh giá địa điểm này rồi. Mỗi người chỉ được đánh giá một lần.');
      } else {
        showError('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
      }
    }
  });

  useEffect(() => {
    if (error) {
      showError('Không thể tải thông tin địa điểm. Vui lòng thử lại sau.');
    }
  }, [error]);

  const handleReviewPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reviewPhotos.length + files.length > 5) {
      showError('Tối đa 5 ảnh cho mỗi đánh giá.');
      return;
    }
    // Validate file sizes (5MB max each)
    const oversized = files.find(f => f.size > 5 * 1024 * 1024);
    if (oversized) {
      showError('Mỗi ảnh không được vượt quá 5MB.');
      return;
    }
    const newPhotos = [...reviewPhotos, ...files];
    setReviewPhotos(newPhotos);
    // Create preview URLs
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setReviewPhotosPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeReviewPhoto = (index: number) => {
    URL.revokeObjectURL(reviewPhotosPreviews[index]);
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    setReviewPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

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
      comment: reviewText,
      photos: reviewPhotos,
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
      } catch {
        // User cancelled share dialog
      }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showSuccess('Đã sao chép liên kết!');
      }).catch(() => {
        showError('Không thể sao chép liên kết.');
      });
    }
  };

  const handleToggleSave = () => {
    if (!user || !place) {
      showError('Vui lòng đăng nhập để lưu địa điểm.');
      return;
    }

    if (place.isSaved) {
      unsaveLocationMutation.mutate({ userId: user.id, locationId: place.id });
    } else {
      saveLocationMutation.mutate({ userId: user.id, locationId: place.id });
    }
  };

  const getOptimizedImageUrls = (rawUrls: string[], locationName: string) => {
    if (!rawUrls || rawUrls.length === 0) {
      const fallback = getCategoryArtwork(locationName);
      return [{ original: fallback, grid: fallback, full: fallback, thumb: fallback }];
    }
    return rawUrls.map(url => {
      const path = getPathFromSupabaseUrl(url);
      if (!path) return { original: url, grid: url, full: url, thumb: url };
      return {
        original: url,
        grid: getTransformedImageUrl(path, { width: 600, height: 600, resize: 'cover' }),
        full: getTransformedImageUrl(path, { width: 1280, height: 800, resize: 'contain' }),
        thumb: getTransformedImageUrl(path, { width: 100, height: 100, resize: 'cover' }),
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-8 w-1/2 mb-4" /><Skeleton className="h-4 w-3/4 mb-6" /><div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div></div>
          <div className="lg:col-span-1"><Skeleton className="h-64 w-full" /></div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center py-16"><h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy địa điểm</h1><p className="text-vietnam-blue-600 mb-8">Địa điểm bạn đang tìm không tồn tại hoặc đã bị xóa.</p><Button asChild variant="outline" className="text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700"><Link href="/search"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại tìm kiếm</Link></Button></div>
      </div>
    );
  }

  const rawImages = [place.main_image_url, ...(place.gallery_urls || [])].filter(Boolean) as string[];
  const isUsingArtwork = rawImages.length === 0;
  const images = getOptimizedImageUrls(rawImages, place.name);
  const selectedImage = images[selectedImageIndex];

  const categories = place.location_categories?.map(lc => lc.categories) || [];
  const tags = place.location_tags?.map(lt => lt.tags) || [];
  const reviews = place.reviews || [];
  const totalReviews = reviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (reviewSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return 0;
  });

  const openingHoursData = place.opening_hours as Record<string, string> | null;
  const daysOfWeek = [{ key: 'monday', label: 'Thứ 2' },{ key: 'tuesday', label: 'Thứ 3' },{ key: 'wednesday', label: 'Thứ 4' },{ key: 'thursday', label: 'Thứ 5' },{ key: 'friday', label: 'Thứ 6' },{ key: 'saturday', label: 'Thứ 7' },{ key: 'sunday', label: 'Chủ nhật' }];
  const todayJsIndex = new Date().getDay();
  const todayIndex = todayJsIndex === 0 ? 6 : todayJsIndex - 1;
  const todayInfo = daysOfWeek[todayIndex];
  const todayHours = openingHoursData?.[todayInfo.key] || 'Chưa cập nhật';

  return (
    <div className="flex flex-col bg-white">
      <div className="flex-grow container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4 text-vietnam-blue-600 hover:text-vietnam-red-600 hover:bg-vietnam-red-50 -ml-2" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button>
        {images.length === 1 ? (
          /* Single image — full-width hero */
          <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group w-full h-full">
                  <Image src={selectedImage.grid} alt={place.name} className="w-full h-full object-cover group-hover:brightness-90 transition-all" width={1200} height={600} priority />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader><DialogTitle>{place.name}</DialogTitle></DialogHeader>
                <div className="flex flex-col items-center">
                  <Image src={selectedImage.full} alt={place.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" width={1280} height={800} />
                </div>
              </DialogContent>
            </Dialog>
            {isUsingArtwork && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                <p className="text-white text-sm italic text-center">{ARTWORK_MESSAGE}</p>
              </div>
            )}
          </div>
        ) : (
          /* Multiple images — grid layout */
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-64 md:h-96 mb-8">
            <div className="col-span-1 md:col-span-2 row-span-2">
              <Dialog>
                <DialogTrigger asChild><div className="relative cursor-pointer group"><Image src={selectedImage.grid} alt={place.name} className="w-full h-full object-cover rounded-lg group-hover:brightness-90 transition-all" width={600} height={600} priority /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center"><Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div></div></DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]"><DialogHeader><DialogTitle>{place.name}</DialogTitle></DialogHeader><div className="flex flex-col items-center"><Image src={selectedImage.full} alt={place.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" width={1280} height={800} /><div className="flex gap-2 mt-4 overflow-x-auto">{images.map((img, index) => (<Image key={index} src={img.thumb} alt={`${place.name} ${index + 1}`} className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${selectedImageIndex === index ? 'border-vietnam-red-600' : 'border-transparent'}`} width={100} height={100} onClick={() => setSelectedImageIndex(index)} />))}</div></div></DialogContent>
              </Dialog>
            </div>
            {images.length > 1 && (<div className="col-span-1 row-span-1"><Image src={images[1].grid} alt={place.name} className="w-full h-full object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all" width={600} height={300} onClick={() => setSelectedImageIndex(1)} /></div>)}
            {images.length > 2 && (<div className="col-span-1 row-span-1"><Image src={images[2].grid} alt={place.name} className="w-full h-full object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all" width={600} height={300} onClick={() => setSelectedImageIndex(2)} /></div>)}
            {images.length > 2 && (
              <div className="col-span-1 md:col-span-2 row-span-1"><div className="w-full h-full bg-muted rounded-lg flex items-center justify-center"><Dialog><DialogTrigger asChild><Button variant="outline"><Camera className="h-4 w-4 mr-2" />Xem tất cả ảnh ({images.length})</Button></DialogTrigger><DialogContent className="max-w-4xl max-h-[90vh]"><DialogHeader><DialogTitle>Thư viện ảnh - {place.name}</DialogTitle></DialogHeader><div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">{images.map((img, index) => (<Image key={index} src={img.grid} alt={`${place.name} ${index + 1}`} className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all" width={400} height={400} onClick={() => setSelectedImageIndex(index)} />))}</div></DialogContent></Dialog></div></div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex-grow"><h1 className="text-4xl font-bold text-vietnam-blue-800 mb-2">{place.name}</h1><div className="flex flex-wrap items-center gap-4 text-lg text-vietnam-blue-600 mb-4">{totalReviews > 0 ? (<div className="flex items-center"><Star className="h-5 w-5 mr-1 fill-vietnam-gold-500 text-vietnam-gold-500" /><span className="font-semibold">{place.average_rating.toFixed(1)}</span><span className="mx-2">·</span><span>({totalReviews} đánh giá)</span></div>) : place.google_rating ? (<div className="flex items-center"><Star className="h-5 w-5 mr-1 fill-vietnam-gold-500 text-vietnam-gold-500" /><span className="font-semibold">{place.google_rating.toFixed(1)}</span><span className="mx-2">·</span><span>({place.google_review_count?.toLocaleString('vi-VN') || 0} đánh giá trên Google)</span></div>) : null}<Badge variant="secondary" className="bg-vietnam-red-100 text-vietnam-red-700">{place.district}</Badge></div></div>
              <div className="flex gap-2 mt-4 md:mt-0"><Button variant="outline" size="sm" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Chia sẻ</Button><Button variant="outline" size="sm" onClick={handleToggleSave} disabled={saveLocationMutation.isPending || unsaveLocationMutation.isPending}><Bookmark className={`h-4 w-4 mr-2 ${place.isSaved ? 'fill-vietnam-red-600 text-vietnam-red-600' : ''}`} />{place.isSaved ? 'Đã lưu' : 'Lưu'}</Button></div>
            </div>
            {(categories.length > 0 || tags.length > 0) && (<div className="mb-6"><div className="flex flex-wrap gap-2">{categories.map((category) => (<Badge key={category.slug} variant="secondary" className="bg-vietnam-blue-100 text-vietnam-blue-700"><Utensils className="h-3 w-3 mr-1" />{category.name}</Badge>))}{tags.map((tag) => (<Badge key={tag.slug} variant="outline" className="border-vietnam-red-300 text-vietnam-red-600">#{tag.name}</Badge>))}</div></div>)}
            <Separator className="my-6" />
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="reviews">Đánh giá ({totalReviews})</TabsTrigger><TabsTrigger value="overview">Tổng quan</TabsTrigger></TabsList>
              <TabsContent value="overview" className="space-y-6 pt-6">
                <div className="space-y-4 text-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" />
                      <span className="text-vietnam-blue-700">{place.address}</span>
                    </div>
                    {place.latitude && place.longitude && (
                      <div className="flex items-center ml-4 flex-shrink-0">
                        {userLocation ? (
                          <Badge variant="outline" className="bg-vietnam-red-50 text-vietnam-red-700 border-vietnam-red-200 shadow-sm py-1.5 px-3">
                            <Navigation className="h-3.5 w-3.5 mr-1.5" />
                            Cách bạn {formatDistance(calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude))}
                          </Badge>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={requestLocation}
                            disabled={isLocating}
                            className="text-vietnam-blue-600 hover:text-vietnam-red-600 h-8 text-xs"
                          >
                            <Navigation className="h-3.5 w-3.5 mr-1" />
                            {isLocating ? 'Đang định vị...' : 'Tính khoảng cách'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center"><DollarSign className="h-5 w-5 mr-3 flex-shrink-0 text-vietnam-red-600" /> <span className="text-vietnam-blue-700">{formatPriceRange(place.price_range)}</span></div>
                </div>
                <Collapsible><CollapsibleTrigger asChild><div className="flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-muted"><div className="flex items-center"><Clock className="h-5 w-5 mr-3 text-vietnam-red-600" /><div><span className="font-semibold text-vietnam-blue-800">{todayInfo.label} (Hôm nay):</span><span className="ml-2 text-vietnam-blue-700 font-medium">{todayHours}</span></div></div><Button variant="ghost" size="sm" className="p-1"><ChevronsUpDown className="h-4 w-4" /><span className="sr-only">Xem thêm</span></Button></div></CollapsibleTrigger><CollapsibleContent><div className="mt-2 p-4 border rounded-lg space-y-3">{daysOfWeek.map(({ key, label }, index) => { const hours = openingHoursData?.[key] || 'Đóng cửa'; const isToday = todayIndex === index; return (<div key={key} className={`flex justify-between items-center`}><span className={`font-medium ${isToday ? 'text-vietnam-red-700' : 'text-vietnam-blue-800'}`}>{label}</span><span className={`${isToday ? 'text-vietnam-red-600 font-semibold' : 'text-vietnam-blue-600'}`}>{hours}</span></div>);})}</div></CollapsibleContent></Collapsible>
                <Alert className="border-vietnam-blue-200 bg-vietnam-blue-50"><Info className="h-4 w-4 text-vietnam-blue-600" /><AlertTitle className="font-semibold text-vietnam-blue-800">Dành cho chủ sở hữu</AlertTitle><AlertDescription className="text-vietnam-blue-700">Chủ quán / chủ cơ sở liên hệ chúng tôi để <strong>xác nhận</strong> địa điểm và update số điện thoại.</AlertDescription></Alert>
                {place.description && (<div><h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Về địa điểm này</h3><div className="prose prose-lg max-w-none text-vietnam-blue-700"><p className="leading-relaxed">{place.description}</p></div></div>)}
                {(place.google_rating || cleanReviewSummary(place.google_review_summary) || (place.google_highlights && place.google_highlights.length > 0)) && (
                  <Card className="border-vietnam-gold-200 bg-vietnam-gold-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-vietnam-red-600 flex items-center text-xl">
                        <Star className="h-5 w-5 mr-2 fill-vietnam-gold-500 text-vietnam-gold-500" />
                        Đánh giá từ Google Maps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {place.google_rating && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-3xl font-bold text-vietnam-blue-800">{place.google_rating.toFixed(1)}</span>
                            <div className="flex ml-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.round(place.google_rating!) ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {place.google_review_count && (
                            <span className="text-sm text-vietnam-blue-600">({place.google_review_count.toLocaleString('vi-VN')} đánh giá trên Google)</span>
                          )}
                        </div>
                      )}
                      {cleanReviewSummary(place.google_review_summary) && (
                        <p className="text-vietnam-blue-700 leading-relaxed italic">&ldquo;{cleanReviewSummary(place.google_review_summary)}&rdquo;</p>
                      )}
                      {place.google_highlights && place.google_highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {place.google_highlights.map((highlight, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-vietnam-gold-100 text-vietnam-gold-800 border-vietnam-gold-300">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {/* Review Insights — rich review data from Google Search grounding */}
                {place.review_insights && (() => {
                  const ri = place.review_insights as ReviewInsights;
                  const hasContent = (ri.top_reviews && ri.top_reviews.length > 0) ||
                    (ri.best_dishes && ri.best_dishes.length > 0) ||
                    (ri.pros && ri.pros.length > 0) ||
                    (ri.cons && ri.cons.length > 0) ||
                    ri.atmosphere || ri.typical_visit;
                  if (!hasContent) return null;
                  return (
                    <Card className="border-vietnam-red-200 bg-vietnam-red-50/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-vietnam-red-600 flex items-center text-xl">
                          <Sparkles className="h-5 w-5 mr-2" />
                          Điểm nổi bật từ cộng đồng
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Best dishes */}
                        {ri.best_dishes && ri.best_dishes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-vietnam-blue-800 mb-2 flex items-center">
                              <Utensils className="h-4 w-4 mr-1.5 text-vietnam-red-600" />
                              Món nên thử
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {ri.best_dishes.map((dish, idx) => (
                                <Badge key={idx} className="bg-vietnam-red-100 text-vietnam-red-700 border-vietnam-red-200">
                                  {dish}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pros & Cons */}
                        {((ri.pros && ri.pros.length > 0) || (ri.cons && ri.cons.length > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ri.pros && ri.pros.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                                  <ThumbsUp className="h-4 w-4 mr-1.5" />
                                  Ưu điểm
                                </h4>
                                <ul className="space-y-1.5">
                                  {ri.pros.map((pro, idx) => (
                                    <li key={idx} className="text-sm text-vietnam-blue-700 flex items-start gap-2">
                                      <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {ri.cons && ri.cons.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                                  <ThumbsDown className="h-4 w-4 mr-1.5" />
                                  Hạn chế
                                </h4>
                                <ul className="space-y-1.5">
                                  {ri.cons.map((con, idx) => (
                                    <li key={idx} className="text-sm text-vietnam-blue-700 flex items-start gap-2">
                                      <span className="text-red-400 mt-0.5 flex-shrink-0">−</span>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Atmosphere & Typical Visit */}
                        {(ri.atmosphere || ri.typical_visit) && (
                          <div className="space-y-2">
                            {ri.atmosphere && (
                              <p className="text-sm text-vietnam-blue-700 leading-relaxed">
                                <span className="font-semibold text-vietnam-blue-800">Không gian: </span>
                                {ri.atmosphere}
                              </p>
                            )}
                            {ri.typical_visit && (
                              <p className="text-sm text-vietnam-blue-700 leading-relaxed">
                                <span className="font-semibold text-vietnam-blue-800">Trải nghiệm: </span>
                                {ri.typical_visit}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Top reviews */}
                        {ri.top_reviews && ri.top_reviews.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-vietnam-blue-800 mb-3 flex items-center">
                              <Quote className="h-4 w-4 mr-1.5 text-vietnam-gold-500" />
                              Đánh giá tiêu biểu
                            </h4>
                            <div className="space-y-3">
                              {ri.top_reviews.slice(0, 3).map((review, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-vietnam-red-100">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-medium text-sm text-vietnam-blue-800">{review.author || 'Ẩn danh'}</span>
                                    {review.rating && (
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3 w-3 ${i < review.rating! ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`}
                                          />
                                        ))}
                                      </div>
                                    )}
                                    {review.time && (
                                      <span className="text-xs text-slate-400">{review.time}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-vietnam-blue-700 leading-relaxed italic">
                                    &ldquo;{review.text}&rdquo;
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
                {tags.length > 0 && (<div><h3 className="text-xl font-semibold mb-4 text-vietnam-red-600">Tiện ích & Đặc điểm</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{tags.map((tag) => {const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { 'wifi': Wifi, 'parking': Car, 'card-payment': CreditCard, 'group': Users, 'kid-friendly': Baby, 'pet-friendly': Dog }; const IconComp = iconMap[tag.slug] || Utensils; return (<div key={tag.slug} className="flex items-center text-vietnam-blue-700"><IconComp className="h-4 w-4 mr-2 text-vietnam-red-600" /><span>{tag.name}</span></div>);})}</div></div>)}
                <Card className="border-vietnam-red-200">
                  <CardHeader>
                    <CardTitle className="text-vietnam-red-600 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Vị trí trên bản đồ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {place.latitude && place.longitude ? (
                      <>
                        <div className="h-64 md:h-80 rounded-lg overflow-hidden relative z-0">
                          <PlaceMap 
                            latitude={place.latitude} 
                            longitude={place.longitude} 
                            name={place.name} 
                            userLocation={userLocation} 
                          />
                        </div>
                        <Button className="btn-vietnam w-full sm:w-auto" asChild>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="h-4 w-4 mr-2" />
                            Chỉ đường trên Google Maps
                          </a>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="h-64 md:h-80 rounded-lg overflow-hidden relative z-0">
                          <iframe
                            title={`Bản đồ ${place.name}`}
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(place.name + ', ' + place.address + ', ' + place.district + ', TP.HCM')}&hl=vi&z=16&output=embed`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                        <Button className="btn-vietnam w-full sm:w-auto" asChild>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.address + ', ' + place.district + ', TP.HCM')}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="h-4 w-4 mr-2" />
                            Xem trên Google Maps
                          </a>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reviews" className="space-y-6 pt-6" id="review-section">
                {totalReviews > 0 && (<Card className="border-vietnam-red-200"><CardHeader><CardTitle className="text-vietnam-red-600">Tổng quan đánh giá</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="text-center"><div className="text-4xl font-bold text-vietnam-blue-800 mb-2">{place.average_rating.toFixed(1)}</div><div className="flex justify-center mb-2">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.round(place.average_rating) ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`} />))}</div><p className="text-vietnam-blue-600">{totalReviews} đánh giá</p></div><div className="space-y-2">{ratingDistribution.map(({ rating, count, percentage }) => (<div key={rating} className="flex items-center gap-2"><span className="text-sm w-8">{rating} ⭐</span><Progress value={percentage} className="flex-1 h-2" /><span className="text-sm text-vietnam-blue-600 w-8">{count}</span></div>))}</div></div></CardContent></Card>)}
                {user && (<Card className="border-vietnam-red-200"><CardHeader><CardTitle className="text-vietnam-red-600">Viết đánh giá</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-sm font-medium text-vietnam-blue-800 mb-2 block">Đánh giá của bạn</label><div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`h-6 w-6 cursor-pointer transition-colors ${star <= reviewRating ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200 hover:fill-vietnam-gold-300 hover:text-vietnam-gold-300'}`} onClick={() => setReviewRating(star)} />))}</div></div><div><label className="text-sm font-medium text-vietnam-blue-800 mb-2 block">Chia sẻ trải nghiệm của bạn</label><Textarea placeholder="Hãy chia sẻ những gì bạn thích về địa điểm này..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="min-h-[100px]" /></div>
                      {/* Photo upload */}
                      <div>
                        <label className="text-sm font-medium text-vietnam-blue-800 mb-2 block">Thêm ảnh (tối đa 5)</label>
                        <div className="flex flex-wrap gap-3">
                          {reviewPhotosPreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-vietnam-red-200">
                              <Image src={preview} alt={`Ảnh ${idx + 1}`} fill className="object-cover" />
                              <button
                                type="button"
                                onClick={() => removeReviewPhoto(idx)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                aria-label={`Xóa ảnh ${idx + 1}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {reviewPhotos.length < 5 && (
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-vietnam-blue-300 flex flex-col items-center justify-center cursor-pointer hover:border-vietnam-red-400 hover:bg-vietnam-red-50 transition-colors">
                              <Camera className="h-5 w-5 text-vietnam-blue-400" />
                              <span className="text-xs text-vietnam-blue-400 mt-1">Thêm ảnh</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleReviewPhotoChange}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <Button onClick={handleSubmitReview} disabled={submitReviewMutation.isPending || isUploadingPhotos || reviewText.trim().length < 10} className="btn-vietnam">{isUploadingPhotos ? 'Đang tải ảnh...' : submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}</Button></CardContent></Card>)}
                <div><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-vietnam-red-600">Đánh giá từ cộng đồng</h3><Select value={reviewSort} onValueChange={setReviewSort}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Mới nhất</SelectItem><SelectItem value="oldest">Cũ nhất</SelectItem><SelectItem value="highest">Điểm cao nhất</SelectItem><SelectItem value="lowest">Điểm thấp nhất</SelectItem></SelectContent></Select></div>{sortedReviews.length > 0 ? (<div className="space-y-6">{sortedReviews.map(review => (<Card key={review.id} className="border-vietnam-red-100"><CardContent className="p-6"><div className="flex items-start gap-4"><Avatar className="h-10 w-10"><AvatarImage src={review.profiles?.avatar_url || undefined} /><AvatarFallback className="bg-vietnam-red-100 text-vietnam-red-700">{review.profiles?.full_name?.[0] || 'U'}</AvatarFallback></Avatar><div className="flex-grow"><div className="flex items-center justify-between mb-2"><div><p className="font-semibold text-vietnam-blue-800">{review.profiles?.full_name || 'Người dùng ẩn danh'}</p><div className="flex items-center gap-2 text-sm text-vietnam-blue-600"><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`} />))}</div><span>·</span><span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span></div></div><div className="flex gap-1"><Button variant="ghost" size="sm" aria-label="Hữu ích" onClick={() => handleToggleLike(review.id)} className={likedReviews.has(review.id) ? 'text-vietnam-red-600' : ''}><Heart className={`h-4 w-4 ${likedReviews.has(review.id) ? 'fill-vietnam-red-600' : ''}`} /></Button></div></div>{review.comment && (<p className="text-vietnam-blue-700 leading-relaxed">{review.comment}</p>)}{review.image_urls && review.image_urls.length > 0 && (<div className="flex flex-wrap gap-2 mt-3">{review.image_urls.map((imgUrl, imgIdx) => (<Dialog key={imgIdx}><DialogTrigger asChild><Image src={imgUrl} alt={`Ảnh đánh giá ${imgIdx + 1}`} className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:brightness-90 transition-all" width={80} height={80} /></DialogTrigger><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Ảnh từ {review.profiles?.full_name || 'Người dùng'}</DialogTitle></DialogHeader><Image src={imgUrl} alt={`Ảnh đánh giá ${imgIdx + 1}`} className="w-full max-h-[70vh] object-contain rounded-lg" width={800} height={600} /></DialogContent></Dialog>))}</div>)}</div></div></CardContent></Card>))}</div>) : (<div className="text-center py-8"><MessageSquare className="h-12 w-12 text-vietnam-blue-300 mx-auto mb-4" /><p className="text-vietnam-blue-600">Chưa có đánh giá nào. Hãy là người đầu tiên!</p></div>)}</div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="lg:col-span-1"><div className="sticky top-20 space-y-6"><Card className="border-vietnam-red-200"><CardHeader><CardTitle className="text-vietnam-red-600">Hành động nhanh</CardTitle></CardHeader><CardContent className="space-y-3">{user ? (<Button className="w-full btn-vietnam" onClick={() => { const el = document.getElementById('review-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}><MessageSquare className="h-4 w-4 mr-2" />Viết đánh giá</Button>) : (<Button asChild className="w-full btn-vietnam"><Link href="/login"><MessageSquare className="h-4 w-4 mr-2" />Đăng nhập để đánh giá</Link></Button>)}<Button variant="outline" className="w-full border-vietnam-red-600 text-vietnam-red-600 hover:bg-vietnam-red-50" onClick={handleToggleSave} disabled={saveLocationMutation.isPending || unsaveLocationMutation.isPending}><Bookmark className={`h-4 w-4 mr-2 ${place.isSaved ? 'fill-vietnam-red-600 text-vietnam-red-600' : ''}`} />{place.isSaved ? 'Đã lưu vào sổ tay' : 'Lưu vào sổ tay'}</Button><Button variant="outline" className="w-full border-vietnam-blue-600 text-vietnam-blue-600 hover:bg-vietnam-blue-50" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Chia sẻ</Button>{user && (<Popover open={collectionPopoverOpen} onOpenChange={setCollectionPopoverOpen}><PopoverTrigger asChild><Button variant="outline" className="w-full border-vietnam-gold-600 text-vietnam-gold-700 hover:bg-vietnam-gold-50"><FolderPlus className="h-4 w-4 mr-2" />Thêm vào bộ sưu tập</Button></PopoverTrigger><PopoverContent className="w-72 p-3" align="start"><div className="space-y-2"><p className="text-sm font-semibold text-vietnam-blue-800 mb-2">Chọn bộ sưu tập</p>{userCollections && userCollections.length > 0 ? (<div className="max-h-40 overflow-y-auto space-y-1">{userCollections.map(c => (<Button key={c.id} variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => { handleAddToCollection(c.id); setCollectionPopoverOpen(false); }}><Check className="h-3 w-3 mr-2 text-vietnam-red-600 opacity-0" />{c.title}</Button>))}</div>) : (<p className="text-sm text-slate-500">Chưa có bộ sưu tập nào.</p>)}<div className="border-t pt-2 mt-2"><div className="flex gap-2"><Input placeholder="Tên bộ sưu tập mới..." value={newCollectionTitle} onChange={e => setNewCollectionTitle(e.target.value)} className="h-8 text-sm" onKeyDown={e => { if (e.key === 'Enter') handleCreateAndAdd(); }} /><Button size="sm" className="btn-vietnam h-8 px-2" onClick={handleCreateAndAdd} disabled={!newCollectionTitle.trim() || createCollection.isPending}><Plus className="h-4 w-4" /></Button></div></div></div></PopoverContent></Popover>)}</CardContent></Card>{similarPlaces && similarPlaces.length > 0 && (<Card className="border-vietnam-red-200"><CardHeader><CardTitle className="text-vietnam-red-600">Địa điểm tương tự</CardTitle></CardHeader><CardContent className="space-y-4">{similarPlaces.map((similarPlace) => { const imagePath = similarPlace.main_image_url ? getPathFromSupabaseUrl(similarPlace.main_image_url) : null; const optimizedImageUrl = imagePath ? getTransformedImageUrl(imagePath, { width: 100, height: 100 }) : getCategoryArtwork(similarPlace.name); return (<Link key={similarPlace.id} href={`/place/${similarPlace.slug}`} className="block group"><div className="flex gap-3 p-2 rounded-lg hover:bg-vietnam-red-50 transition-colors"><Image src={optimizedImageUrl} alt={similarPlace.name} className="w-16 h-16 object-cover rounded-lg" width={100} height={100} /><div className="flex-grow min-w-0"><p className="font-medium text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors truncate">{similarPlace.name}</p><p className="text-sm text-vietnam-blue-600">{similarPlace.district}</p>{similarPlace.average_rating > 0 && (<div className="flex items-center text-sm"><Star className="h-3 w-3 fill-vietnam-gold-500 text-vietnam-gold-500 mr-1" />{similarPlace.average_rating.toFixed(1)}</div>)}</div></div></Link>); })}</CardContent></Card>)}</div></div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailPage;
