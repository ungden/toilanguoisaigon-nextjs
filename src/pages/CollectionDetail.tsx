import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock, Phone, DollarSign } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection, Location } from '@/types/database';

interface CollectionWithLocations extends Collection {
  collection_categories: {
    name: string;
    slug: string;
    icon: string;
  } | null;
  collection_locations: {
    locations: Location;
  }[];
}

const fetchCollectionDetail = async (slug: string): Promise<CollectionWithLocations | null> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_categories (
        name,
        slug,
        icon
      ),
      collection_locations (
        locations (*)
      )
    `)
    .ilike('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching collection detail:', error);
    throw new Error(error.message);
  }

  return data;
};

const formatPriceRange = (priceRange: string | null) => {
  const priceMap: { [key: string]: string } = {
    '$': 'Dưới 100k',
    '$$': '100k - 300k',
    '$$$': '300k - 500k',
    '$$$$': 'Trên 500k'
  };
  return priceRange ? priceMap[priceRange] || priceRange : 'Chưa cập nhật';
};

const formatOpeningHours = (openingHours: any) => {
  if (!openingHours || typeof openingHours !== 'object') return 'Chưa cập nhật';
  
  const today = new Date().getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const todayHours = openingHours[days[today]] || openingHours.monday;
  return todayHours === '24h' ? 'Mở cửa 24h' : todayHours || 'Chưa cập nhật';
};

const CollectionDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: collection, isLoading, error } = useQuery<CollectionWithLocations | null, Error>({
    queryKey: ['collection-detail', slug],
    queryFn: () => fetchCollectionDetail(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-3/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy bộ sưu tập</h1>
            <p className="text-vietnam-blue-600">Bộ sưu tập bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/collections" className="text-vietnam-red-600 hover:underline mt-4 inline-block">
              ← Quay lại danh sách bộ sưu tập
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const locations = collection.collection_locations.map(cl => cl.locations).filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-16 bg-vietnam-red-600">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531697111548-0c45f24911da?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              {collection.collection_categories && (
                <Badge className="mb-4 bg-vietnam-blue-600 text-white">
                  {collection.collection_categories.name}
                </Badge>
              )}
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {collection.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                {collection.description}
              </p>
              <div className="mt-8">
                <span className="text-vietnam-gold-400 font-semibold">
                  {locations.length} địa điểm được tuyển chọn
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Grid */}
        <section className="container mx-auto py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations.map((location) => (
              <Link to={`/place/${location.slug}`} key={location.id} className="block group">
                <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full bg-white">
                  <div className="relative overflow-hidden">
                    <img 
                      src={location.main_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'} 
                      alt={location.name} 
                      className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-vietnam-red-600 text-white">
                        {formatPriceRange(location.price_range)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors mb-2">
                      {location.name}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-vietnam-blue-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{location.district}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{formatOpeningHours(location.opening_hours)}</span>
                      </div>
                      
                      {location.phone_number && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{location.phone_number}</span>
                        </div>
                      )}
                    </div>

                    {location.average_rating > 0 && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-vietnam-gold-500 fill-vietnam-gold-500 mr-1" />
                        <span className="text-sm font-medium text-vietnam-blue-700">
                          {location.average_rating.toFixed(1)} ({location.review_count} đánh giá)
                        </span>
                      </div>
                    )}

                    {location.description && (
                      <p className="text-sm text-vietnam-blue-600 mt-3 line-clamp-2">
                        {location.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {locations.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-vietnam-blue-800 mb-2">
                Chưa có địa điểm nào
              </h3>
              <p className="text-vietnam-blue-600">
                Bộ sưu tập này đang được cập nhật thêm địa điểm mới.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CollectionDetailPage;