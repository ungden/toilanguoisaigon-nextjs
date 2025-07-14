import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { usePost } from "@/hooks/data/usePost";
import { useParams, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PostDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePost(slug!);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="aspect-[16/9] w-full rounded-lg mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-vietnam-red-600 mb-4">Không tìm thấy bài viết</h1>
            <p className="text-vietnam-blue-600">Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Button asChild variant="outline" className="mt-8">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại trang Blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <article>
            <header className="mb-8">
              <h1 className="text-3xl md:text-5xl font-bold text-vietnam-blue-800 mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback>{post.profiles?.full_name?.[0] || 'A'}</AvatarFallback>
                  </Avatar>
                  <span>{post.profiles?.full_name || 'Admin'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </header>

            {post.cover_image_url && (
              <img 
                src={post.cover_image_url} 
                alt={post.title}
                className="w-full aspect-[16/9] object-cover rounded-lg mb-8"
              />
            )}

            <div 
              className="prose prose-lg max-w-none prose-p:text-vietnam-blue-700 prose-headings:text-vietnam-red-600"
              dangerouslySetInnerHTML={{ __html: post.content || '' }} 
            />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetailPage;