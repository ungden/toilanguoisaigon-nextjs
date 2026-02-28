"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useNearbyLocations } from '@/hooks/data/useNearbyLocations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPathFromSupabaseUrl, getTransformedImageUrl } from '@/utils/image';
import { FALLBACK_IMAGES } from '@/utils/constants';
import { formatDistance } from '@/utils/geo';

// Dynamic import map to prevent SSR issues with Leaflet
const NearbyMap = dynamic(() => import('@/components/map/NearbyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400">
      <MapPin className="h-8 w-8 mb-2 opacity-50" />
      <span>Đang tải bản đồ...</span>
    </div>
  )
});

export default function NearbyPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [radius, setRadius] = useState(5); // 5km default

  const { data: locations, isLoading } = useNearbyLocations({
    latitude: userLocation?.lat || null,
    longitude: userLocation?.lng || null,
    radiusKm: radius,
  });

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt của bạn không hỗ trợ định vị GPS.");
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
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt để sử dụng tính năng này.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Không thể xác định được vị trí hiện tại.");
            break;
          case error.TIMEOUT:
            setLocationError("Yêu cầu định vị quá thời gian. Vui lòng thử lại.");
            break;
          default:
            setLocationError("Đã xảy ra lỗi khi lấy vị trí.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-request location on first load if not already set
  useEffect(() => {
    if (!userLocation && !locationError && !isLocating) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="-ml-2">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-vietnam-blue-800 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-vietnam-red-600" />
              Quanh Đây
            </h1>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={requestLocation}
            disabled={isLocating}
            className="text-vietnam-blue-600 border-vietnam-blue-200"
          >
            {isLocating ? 'Đang định vị...' : 'Cập nhật vị trí'}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Error message */}
        {locationError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex flex-col items-center justify-center text-center">
            <MapPin className="h-8 w-8 mb-2 opacity-80" />
            <p className="font-medium">{locationError}</p>
            <Button 
              variant="default" 
              className="mt-4 bg-vietnam-red-600 hover:bg-vietnam-red-700 text-white"
              onClick={requestLocation}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
          
          {/* Map View (Left/Top) */}
          <div className="lg:col-span-7 xl:col-span-8 h-[40vh] lg:h-full relative rounded-lg shadow-sm border border-slate-200 overflow-hidden bg-white">
            <NearbyMap userLocation={userLocation} locations={locations || []} />
            
            {/* Radius Control Overlay */}
            {userLocation && (
              <div className="absolute top-4 right-4 z-[400] bg-white rounded-md shadow-md border border-slate-200 p-2 flex gap-2">
                <Button 
                  size="sm" 
                  variant={radius === 2 ? 'default' : 'outline'}
                  onClick={() => setRadius(2)}
                  className={radius === 2 ? 'bg-vietnam-red-600' : ''}
                >
                  2km
                </Button>
                <Button 
                  size="sm" 
                  variant={radius === 5 ? 'default' : 'outline'}
                  onClick={() => setRadius(5)}
                  className={radius === 5 ? 'bg-vietnam-red-600' : ''}
                >
                  5km
                </Button>
                <Button 
                  size="sm" 
                  variant={radius === 10 ? 'default' : 'outline'}
                  onClick={() => setRadius(10)}
                  className={radius === 10 ? 'bg-vietnam-red-600' : ''}
                >
                  10km
                </Button>
              </div>
            )}
          </div>

          {/* List View (Right/Bottom) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-vietnam-blue-800">
                {locations?.length ? `${locations.length} địa điểm gần bạn` : 'Các địa điểm quanh bạn'}
              </h2>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-4">
              {!userLocation && !locationError && (
                <div className="text-center py-10 text-slate-500">
                  <Navigation className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>Vui lòng cho phép truy cập vị trí để xem các quán ăn gần bạn nhất.</p>
                </div>
              )}

              {userLocation && isLoading && (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-0 flex h-28">
                        <Skeleton className="w-28 h-full rounded-none" />
                        <div className="p-3 flex flex-col justify-between flex-grow">
                          <div>
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <Skeleton className="h-4 w-1/4 mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {userLocation && !isLoading && locations && locations.length === 0 && (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Không tìm thấy địa điểm nào trong bán kính {radius}km.</p>
                  <Button variant="link" onClick={() => setRadius(10)} className="text-vietnam-red-600">
                    Mở rộng bán kính lên 10km
                  </Button>
                </div>
              )}

              {userLocation && !isLoading && locations && locations.map((loc) => {
                const imagePath = loc.main_image_url ? getPathFromSupabaseUrl(loc.main_image_url) : null;
                const imageUrl = imagePath 
                  ? getTransformedImageUrl(imagePath, { width: 200, height: 200 }) 
                  : FALLBACK_IMAGES.location;

                return (
                  <Link href={`/place/${loc.slug}`} key={loc.id} className="block group">
                    <Card className="overflow-hidden card-hover border-slate-200 transition-all hover:border-vietnam-red-300">
                      <CardContent className="p-0 flex h-28">
                        <div className="relative w-28 h-full flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={loc.name}
                            fill
                            sizes="112px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3 flex flex-col justify-between flex-grow overflow-hidden">
                          <div>
                            <h3 className="font-semibold text-vietnam-blue-800 text-sm line-clamp-1 group-hover:text-vietnam-red-600 transition-colors">
                              {loc.name}
                            </h3>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <span className="truncate max-w-[120px]">{loc.district}</span>
                              <span className="mx-1.5">•</span>
                              <span className="text-vietnam-red-600 font-medium whitespace-nowrap bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                                {formatDistance(loc.distance_km)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center text-yellow-500 text-xs">
                              <Star className="h-3.5 w-3.5 fill-current mr-1" />
                              <span className="font-medium">{loc.average_rating > 0 ? loc.average_rating.toFixed(1) : 'Mới'}</span>
                              <span className="text-slate-400 ml-1">({loc.review_count})</span>
                            </div>
                            
                            {loc.category && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 bg-slate-50 text-slate-600 border-slate-200">
                                {loc.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
