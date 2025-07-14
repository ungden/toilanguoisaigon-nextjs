import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/data/usePosts";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Rss } from "lucide-react";

const BlogPage = () => {
  const { data: posts, isLoading } = usePosts();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <section className="bg-vietnam-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Blog & Review
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Khám phá Sài Gòn qua những câu chuyện, góc nhìn và bài đánh giá chuyên sâu từ cộng đồng.
            </p>
          </div>
        </section>

        <section className="container mx-auto py-16 px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="block group">
                  <Card className="overflow-hidden card-hover border-vietnam-red-200 h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <img 
                        src={post.cover_image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop'} 
                        alt={post.title} 
                        className="aspect-[16/9] w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <CardHeader className="bg-white flex-grow">
                      <CardTitle className="text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors text-xl leading-tight">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-vietnam-blue-600 text-sm leading-relaxed mt-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.profiles?.avatar_url || ''} />
                            <AvatarFallback>{post.profiles?.full_name?.[0] || 'A'}</AvatarFallback>
                          </Avatar>
                          <span>{post.profiles?.full_name || 'Admin'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Rss className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-semibold">Chưa có bài viết nào</h2>
              <p className="mt-2 text-muted-foreground">
                Nội dung đang được chuẩn bị. Vui lòng quay lại sau!
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;