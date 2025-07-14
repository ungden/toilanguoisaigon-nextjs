import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FormEvent, useEffect } from "react";
import { useCollections } from "../hooks/data/useCollections";
import { useLocations } from "../hooks/data/useLocations";
import { usePosts } from "@/hooks/data/usePosts";
import { showError } from "@/utils/toast";

const Index = () => {
  const navigate = useNavigate();
  const { data: collections, isLoading: isLoadingCollections } = useCollections();
  const { data: newPlaces, isLoading: isLoadingNewPlaces, error: locationsError } = useLocations({ limit: 4 });
  const { data: posts, isLoading: isLoadingPosts } = usePosts();

  useEffect(() => {
    if (locationsError) {
      console.error("Error loading locations:", locationsError);
      showError("Không thể tải danh sách địa điểm. Vui lòng thử lại sau.");
    }
  }, [locationsError]);

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
        {/* Hero Section */}
        <section className="relative text-center py-24 md:py-32 overflow-hidden bg-vietnam-red-600">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531697111548-0c45f24911da?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
          <div className="relative container mx-auto px-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Tìm <span className="text-vietnam-gold-400">"chất"</span> Sài Gòn
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed">
                Khám phá những địa điểm ẩm thực và văn hóa độc đáo của Sài Gòn
              </p>
              <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                    <Input
                      type="text"
                      name="query"
                      placeholder="Tìm kiếm tên quán, món ăn, địa chỉ..."
                      className="h-14 text-base pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:border-white/50"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 px-8 bg-vietnam-blue-600 hover:bg-vietnam-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Search className="h-5 w-5 mr-2" />
                    Tìm kiếm
                  </Button>
                </div>
              </form>
              
              <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-white/80 text-sm md:text-base">Địa điểm</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
                  <div className="text-white/80 text-sm md:text-base">Đánh giá</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                  <div className="text-white/80 text-sm md:text-base">Bộ sưu tập</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section className="container mx-auto py-20 px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-vietnam-red-100 text-vietnam-red-700 hover:bg-vietnam-red-200">
              <Star className="h-4 w-4 mr-1" />
              Nổi bật
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-vietnam-red-600">Bộ sưu tập nổi bật</h2>
            <p className="text-lg text-vietnam-blue-600 max-w-2xl mx-auto">
              Những danh sách chọn lọc theo "gu" và "tâm trạng" của bạn, được tuyển chọn bởi đội ngũ chuyên gia ẩm thực.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoadingCollections ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))
            ) : collections && collections.length > 0 ? (
              collections.map((collection) => (
                <Link to={`/collection/${collection.slug}`} key={collection.id} className="block group">
                  <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <img 
                        src={collection.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop'} 
                        alt={collection.title} 
                        className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardHeader className="bg-white flex-grow">
                      <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors">
                        {collection.title}
                      </CardTitle>
                      <CardDescription className="text-vietnam-blue-600 line-clamp-2">
                        {collection.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-vietnam-blue-600">Chưa có bộ sưu tập nào. Hãy quay lại sau!</p>
              </div>
            )}
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="outline" className="text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700">
              <Link to="/collections">
                Xem tất cả bộ sưu tập
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* New Places Section */}
        <section className="bg-vietnam-blue-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-vietnam-blue-100 text-vietnam-blue-700 hover:bg-vietnam-blue-200">
                <TrendingUp className="h-4 w-4 mr-1" />
                Mới cập nhật
              </Badge>
              <h2 className="text-4xl font-bold mb-4 text-vietnam-blue-600">Địa điểm mới cập nhật</h2>
              <p className="text-lg text-vietnam-blue-600 max-w-2xl mx-auto">
                Những quán hay ho vừa được thêm vào hệ thống, chờ bạn khám phá và trải nghiệm.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {isLoadingNewPlaces ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : newPlaces && newPlaces.length > 0 ? (
                newPlaces.map((place) => (
                  <Link to={`/place/${place.slug}`} key={place.id} className="block group">
                    <Card className="overflow-hidden card-hover border-vietnam-blue-200 h-full bg-white">
                      <div className="relative overflow-hidden">
                        <img 
                          src={place.main_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop'} 
                          alt={place.name} 
                          className="aspect-[4/3] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-vietnam-red-600 text-white">
                            Mới
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors mb-2">
                          {place.name}
                        </h3>
                        <div className="flex items-center text-vietnam-blue-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{place.district}</span>
                        </div>
                        {place.average_rating > 0 && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-vietnam-gold-500 fill-vietnam-gold-500 mr-1" />
                            <span className="text-sm font-medium text-vietnam-blue-700">
                              {place.average_rating.toFixed(1)} ({place.review_count} đánh giá)
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-8">
                  <p className="text-vietnam-blue-600">Chưa có địa điểm nào. Hãy quay lại sau!</p>
                </div>
              )}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="outline" className="text-vietnam-blue-600 border-vietnam-blue-600 hover:bg-vietnam-blue-100 hover:text-vietnam-blue-700">
                <Link to="/search">
                  Xem tất cả địa điểm
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="container mx-auto py-20 px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-vietnam-gold-100 text-vietnam-gold-700 hover:bg-vietnam-gold-200">
              <Users className="h-4 w-4 mr-1" />
              Cộng đồng
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-vietnam-gold-600">Blog & Review chuyên sâu</h2>
            <p className="text-lg text-vietnam-blue-600 max-w-2xl mx-auto">
              Đọc những câu chuyện và khám phá Sài Gòn qua từng góc nhìn của cộng đồng yêu ẩm thực.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><Skeleton className="h-64 w-full" /></Card>
              ))
            ) : posts && posts.length > 0 ? (
              posts.slice(0, 3).map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="block group">
                  <Card className="overflow-hidden card-hover border-vietnam-gold-200 h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <img 
                        src={post.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop'} 
                        alt={post.title} 
                        className="aspect-[16/9] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <CardHeader className="bg-white flex-grow">
                      <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-lg">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-vietnam-blue-600 text-sm line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-vietnam-blue-600">Chưa có bài viết nào để hiển thị.</p>
              </div>
            )}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="btn-vietnam">
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