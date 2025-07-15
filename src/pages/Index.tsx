import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, TrendingUp, Users, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FormEvent, useEffect, useMemo } from "react";
import { useCollections } from "../hooks/data/useCollections";
import { useLocations } from "../hooks/data/useLocations";
import { usePosts } from "@/hooks/data/usePosts";
import { showError } from "@/utils/toast";
import { formatPriceRange } from "@/utils/formatters";
import { getTransformedImageUrl, getPathFromSupabaseUrl } from "@/utils/image";

const Index = () => {
  const navigate = useNavigate();
  const { data: collections, isLoading: isLoadingCollections } = useCollections();
  const { data: newPlaces, isLoading: isLoadingNewPlaces, error: locationsError } = useLocations({ limit: 8 });
  const { data: posts, isLoading: isLoadingPosts, error: postsError } = usePosts();

  const sortedCollections = useMemo(() => {
    if (!collections) return [];

    const priorityTitles = [
      "Michelin Sài Gòn 2025",
      "Check-in Sống Ảo Triệu Like"
    ];
    
    const priorityItems = [];
    const otherItems = [];

    for (const collection of collections) {
      if (priorityTitles.includes(collection.title)) {
        priorityItems.push(collection);
      } else {
        otherItems.push(collection);
      }
    }
    
    priorityItems.sort((a, b) => priorityTitles.indexOf(a.title) - priorityTitles.indexOf(b.title));

    const allSorted = [...priorityItems, ...otherItems];
    return allSorted.slice(0, 8);

  }, [collections]);

  useEffect(() => {
    if (locationsError) {
      console.error("Error loading locations:", locationsError);
      showError("Không thể tải danh sách địa điểm. Vui lòng thử lại sau.");
    }
  }, [locationsError]);

  useEffect(() => {
    if (postsError) {
      console.error("Error loading posts:", postsError);
      console.log("Posts error details:", postsError.message);
    }
  }, [postsError]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("query") as string;
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        {/* Compact Hero Section with Saigon Image */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2070&auto=format&fit=crop" 
              alt="Sài Gòn skyline" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                Khám phá{" "}
                <span className="text-vietnam-gold-300">"chất"</span>{" "}
                Sài Gòn
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                Tìm kiếm những địa điểm ẩm thực độc đáo nhất thành phố
              </p>
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="relative">
                  <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vietnam-blue-600" />
                      <Input
                        type="text"
                        name="query"
                        placeholder="Tìm kiếm tên quán, món ăn, khu vực..."
                        className="h-12 text-base pl-12 bg-transparent border-none text-vietnam-blue-800 placeholder:text-vietnam-blue-500 focus:ring-0 focus:outline-none"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="h-12 px-6 bg-vietnam-red-600 hover:bg-vietnam-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Tìm kiếm
                    </Button>
                  </div>
                </div>
              </form>
              <div className="flex justify-center gap-8 mt-8 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-vietnam-gold-300">500+</div>
                  <div className="text-white/80">Địa điểm</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-vietnam-gold-300">1000+</div>
                  <div className="text-white/80">Đánh giá</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-vietnam-gold-300">50+</div>
                  <div className="text-white/80">Bộ sưu tập</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section className="bg-vietnam-blue-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-vietnam-blue-100 text-vietnam-blue-700 hover:bg-vietnam-blue-200">
                <Star className="h-4 w-4 mr-1" />
                Bộ sưu tập
              </Badge>
              <h2 className="text-3xl font-bold mb-4 text-vietnam-blue-800">Danh sách chọn lọc</h2>
              <p className="text-lg text-vietnam-blue-600 max-w-2xl mx-auto">
                Những bộ sưu tập được tuyển chọn theo chủ đề và phong cách
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoadingCollections ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                  </Card>
                ))
              ) : sortedCollections && sortedCollections.length > 0 ? (
                sortedCollections.map((collection, index) => {
                  const imagePath = collection.cover_image_url ? getPathFromSupabaseUrl(collection.cover_image_url) : null;
                  const optimizedImageUrl = imagePath 
                    ? getTransformedImageUrl(imagePath, { width: 400, height: 300 }) 
                    : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop';

                  return (
                    <Link to={`/collection/${collection.slug}`} key={collection.id} className="block group">
                      <Card className="overflow-hidden card-hover border-vietnam-blue-200 h-full flex flex-col bg-white">
                        <div className="relative overflow-hidden">
                          <img 
                            src={
                              collection.title === "Michelin Sài Gòn 2025" 
                                ? "https://assets.dyad.ai/michelin-saigon-2025.png" 
                                : optimizedImageUrl
                            } 
                            alt={collection.title} 
                            className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          {index < 2 && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-vietnam-gold-500 text-white border-vietnam-gold-600 shadow-lg">
                                <Sparkles className="h-3 w-3 mr-1.5" />
                                Đặc biệt
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader className="bg-white flex-grow">
                          <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg">
                            {collection.title}
                          </CardTitle>
                          <CardDescription className="text-vietnam-blue-600 line-clamp-2 text-sm">
                            {collection.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  )
                })
              ) : (
                <div className="col-span-4 text-center py-8">
                  <p className="text-vietnam-blue-600">Chưa có bộ sưu tập nào. Hãy quay lại sau!</p>
                </div>
              )}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" className="text-vietnam-blue-600 border-vietnam-blue-600 hover:bg-vietnam-blue-100 hover:text-vietnam-blue-700">
                <Link to="/collections">
                  Xem tất cả bộ sưu tập
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Locations - Main Focus */}
        <section className="container mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-vietnam-red-100 text-vietnam-red-700 hover:bg-vietnam-red-200">
              <TrendingUp className="h-4 w-4 mr-1" />
              Địa điểm nổi bật
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-vietnam-blue-800">Khám phá Sài Gòn</h2>
            <p className="text-lg text-vietnam-blue-600 max-w-2xl mx-auto">
              Những địa điểm ẩm thực được yêu thích nhất, từ quán vỉa hè đến nhà hàng cao cấp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingNewPlaces ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : newPlaces && newPlaces.length > 0 ? (
              newPlaces.map((place) => {
                const imagePath = place.main_image_url ? getPathFromSupabaseUrl(place.main_image_url) : null;
                const optimizedImageUrl = imagePath 
                  ? getTransformedImageUrl(imagePath, { width: 400, height: 300 }) 
                  : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop';
                
                return (
                  <Link to={`/place/${place.slug}`} key={place.id} className="block group">
                    <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full bg-white">
                      <div className="relative overflow-hidden">
                        <img 
                          src={optimizedImageUrl} 
                          alt={place.name} 
                          className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-vietnam-red-600 text-white text-xs">
                            {place.district}
                          </Badge>
                        </div>
                        {place.average_rating > 0 && (
                          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center">
                            <Star className="h-3 w-3 text-vietnam-gold-400 fill-vietnam-gold-400 mr-1" />
                            {place.average_rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors mb-2 line-clamp-1">
                          {place.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-vietnam-blue-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{place.address}</span>
                          </div>
                          
                          {place.price_range && (
                            <div className="flex items-center">
                              <span className="text-vietnam-gold-600 font-medium">
                                {formatPriceRange(place.price_range)}
                              </span>
                            </div>
                          )}

                          {place.review_count > 0 && (
                            <div className="text-xs text-vietnam-blue-500">
                              {place.review_count} đánh giá
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-vietnam-blue-600">Chưa có địa điểm nào. Hãy quay lại sau!</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="btn-vietnam">
              <Link to="/search">
                Xem tất cả địa điểm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Blog Section - Compact */}
        <section className="container mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-vietnam-gold-100 text-vietnam-gold-700 hover:bg-vietnam-gold-200">
              <Users className="h-4 w-4 mr-1" />
              Blog & Review
            </Badge>
            <h2 className="text-3xl font-bold mb-4 text-vietnam-gold-600">Câu chuyện ẩm thực</h2>
            <p className="text-lg text-vietnam-blue-600 max-w-2xl mx-auto">
              Khám phá Sài Gòn qua những câu chuyện và review chuyên sâu
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))
            ) : postsError ? (
              <div className="col-span-3 text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 font-semibold mb-2">Có lỗi khi tải bài viết</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
            ) : posts && posts.length > 0 ? (
              posts.slice(0, 3).map((post) => {
                const imagePath = post.cover_image_url ? getPathFromSupabaseUrl(post.cover_image_url) : null;
                const optimizedImageUrl = imagePath 
                  ? getTransformedImageUrl(imagePath, { width: 500, height: 281 }) 
                  : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop';

                return (
                  <Link to={`/blog/${post.slug}`} key={post.id} className="block group">
                    <Card className="overflow-hidden card-hover border-vietnam-gold-200 h-full flex flex-col bg-white">
                      <div className="relative overflow-hidden">
                        <img 
                          src={optimizedImageUrl} 
                          alt={post.title} 
                          className="aspect-[16/9] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      </div>
                      <CardHeader className="bg-white flex-grow">
                        <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg line-clamp-2">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="text-vietnam-blue-600 text-sm line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-vietnam-blue-600">Chưa có bài viết nào. Hãy quay lại sau!</p>
              </div>
            )}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="text-vietnam-gold-600 border-vietnam-gold-600 hover:bg-vietnam-gold-50 hover:text-vietnam-gold-700">
              <Link to="/blog">
                Xem tất cả bài viết
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;