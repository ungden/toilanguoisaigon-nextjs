import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, TrendingUp, Users, ArrowRight, AlertCircle, Sparkles, Coffee, Utensils, Heart } from "lucide-react";
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
  const { data: posts, isLoading: isLoadingPosts, error: postsError } = usePosts();

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
        <section className="relative overflow-hidden bg-gradient-to-br from-vietnam-red-600 via-vietnam-red-500 to-vietnam-blue-600 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 animate-bounce delay-1000">
              <Coffee className="h-8 w-8 text-vietnam-gold-300 opacity-60" />
            </div>
            <div className="absolute top-32 right-20 animate-bounce delay-2000">
              <Utensils className="h-10 w-10 text-vietnam-gold-300 opacity-40" />
            </div>
            <div className="absolute bottom-32 left-20 animate-bounce delay-3000">
              <Heart className="h-6 w-6 text-vietnam-gold-300 opacity-50" />
            </div>
            <div className="absolute bottom-20 right-10 animate-bounce delay-500">
              <Sparkles className="h-7 w-7 text-vietnam-gold-300 opacity-60" />
            </div>
          </div>

          <div className="relative container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 animate-fade-in">
                <Sparkles className="h-4 w-4 mr-2 text-vietnam-gold-300" />
                <span className="text-sm font-medium">Khám phá Sài Gòn cùng chúng tôi</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight animate-fade-in">
                Tìm{" "}
                <span className="relative inline-block">
                  <span className="text-vietnam-gold-300 relative z-10">"chất"</span>
                  <div className="absolute inset-0 bg-vietnam-gold-500/20 blur-lg rounded-lg transform rotate-1"></div>
                </span>
                <br />
                <span className="bg-gradient-to-r from-white via-vietnam-gold-200 to-white bg-clip-text text-transparent">
                  Sài Gòn
                </span>
              </h1>

              <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-4 leading-relaxed font-light animate-fade-in">
                Khám phá những địa điểm ẩm thực và văn hóa
              </p>
              <p className="text-lg md:text-xl text-vietnam-gold-200 mb-12 font-medium animate-fade-in">
                độc đáo nhất của thành phố Hồ Chí Minh
              </p>

              <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-16 animate-fade-in">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-vietnam-gold-400 to-vietnam-gold-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative flex flex-col sm:flex-row gap-3 p-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vietnam-blue-600" />
                      <Input
                        type="text"
                        name="query"
                        placeholder="Tìm kiếm tên quán, món ăn, địa chỉ..."
                        className="h-14 text-base pl-12 bg-transparent border-none text-vietnam-blue-800 placeholder:text-vietnam-blue-500 focus:ring-0 focus:outline-none"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="h-14 px-8 bg-gradient-to-r from-vietnam-red-600 to-vietnam-red-700 hover:from-vietnam-red-700 hover:to-vietnam-red-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      Khám phá ngay
                    </Button>
                  </div>
                </div>
              </form>
              
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in">
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
                    <div className="absolute inset-0 bg-vietnam-gold-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-white/80 text-sm md:text-base font-medium">Địa điểm</div>
                </div>
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">1000+</div>
                    <div className="absolute inset-0 bg-vietnam-gold-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-white/80 text-sm md:text-base font-medium">Đánh giá</div>
                </div>
                <div className="text-center group">
                  <div className="relative">
                    <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
                    <div className="absolute inset-0 bg-vietnam-gold-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-white/80 text-sm md:text-base font-medium">Bộ sưu tập</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in">
                <Button asChild size="lg" className="bg-white text-vietnam-red-600 hover:bg-vietnam-gold-50 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Link to="/collections">
                    <Star className="h-5 w-5 mr-2" />
                    Xem bộ sưu tập
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-vietnam-red-600 font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                  <Link to="/blog">
                    <Users className="h-5 w-5 mr-2" />
                    Đọc blog
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 fill-white">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
            </svg>
          </div>
        </section>

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
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                </Card>
              ))
            ) : postsError ? (
              <div className="col-span-3 text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 font-semibold mb-2">Có lỗi khi tải bài viết</p>
                <p className="text-sm text-muted-foreground">{postsError.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
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
              <div className="col-span-3 text-center py-8">
                <p className="text-vietnam-blue-600">Chưa có bài viết nào. Hãy quay lại sau!</p>
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