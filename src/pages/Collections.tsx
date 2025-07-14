import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection } from '@/types/database';
import { Clock, MapPin, Target, Palette, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

interface CollectionWithCategory extends Collection {
  collection_categories: {
    name: string;
    slug: string;
    icon: string;
  } | null;
}

const fetchCollectionsWithCategories = async (): Promise<CollectionWithCategory[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_categories (
        name,
        slug,
        icon
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error);
    throw new Error(error.message);
  }

  return data || [];
};

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: any } = {
    Clock,
    MapPin,
    Target,
    Palette,
    Users,
    Award
  };
  return icons[iconName] || MapPin;
};

const CollectionsPage = () => {
  const { data: collections, isLoading } = useQuery<CollectionWithCategory[], Error>({
    queryKey: ['collections-with-categories'],
    queryFn: fetchCollectionsWithCategories,
  });

  // Group collections by category
  const groupedCollections = collections?.reduce((acc, collection) => {
    const categoryName = collection.collection_categories?.name || 'Khác';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        category: collection.collection_categories,
        collections: []
      };
    }
    acc[categoryName].collections.push(collection);
    return acc;
  }, {} as Record<string, { category: any, collections: CollectionWithCategory[] }>);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-vietnam-red-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Bộ Sưu Tập Đặc Biệt
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Khám phá Sài Gòn qua những góc nhìn độc đáo, từ những quán vỉa hè tinh hoa đến không gian fine dining đẳng cấp
            </p>
          </div>
        </section>

        {/* Collections by Category */}
        <section className="container mx-auto py-16 px-4">
          {isLoading ? (
            <div className="space-y-12">
              {Array.from({ length: 3 }).map((_, categoryIndex) => (
                <div key={categoryIndex}>
                  <Skeleton className="h-8 w-64 mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedCollections || {}).map(([categoryName, { category, collections }]) => {
                const IconComponent = getIconComponent(category?.icon || 'MapPin');
                
                return (
                  <div key={categoryName}>
                    <div className="flex items-center mb-8">
                      <IconComponent className="h-8 w-8 text-vietnam-red-600 mr-3" />
                      <h2 className="text-3xl font-bold text-vietnam-blue-800">{categoryName}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {collections.map((collection) => (
                        <Link to={`/collection/${collection.slug}`} key={collection.id} className="block group">
                          <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full">
                            <div className="relative overflow-hidden">
                              <img 
                                src={collection.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop'} 
                                alt={collection.title} 
                                className="h-56 w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute top-4 left-4">
                                <Badge className="bg-vietnam-blue-600 text-white">
                                  {categoryName}
                                </Badge>
                              </div>
                            </div>
                            <CardHeader className="bg-white flex-grow">
                              <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg leading-tight">
                                {collection.title}
                              </CardTitle>
                              <CardDescription className="text-vietnam-blue-600 text-sm leading-relaxed">
                                {collection.description}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CollectionsPage;