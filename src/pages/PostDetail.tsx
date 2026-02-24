import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { usePost } from "@/hooks/data/usePost";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/seo/PageMeta";

const PostDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
            <p className="text-vietnam-blue-600 mb-8">Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
            <Button asChild variant="outline" className="text-vietnam-red-600 border-vietnam-red-600 hover:bg-vietnam-red-50 hover:text-vietnam-red-700">
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
      <PageMeta title={post.title} description={post.excerpt || undefined} image={post.cover_image_url || undefined} type="article" />
      <Header />
      <main className="flex-grow py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-6 text-vietnam-blue-600 hover:text-vietnam-red-600 hover:bg-vietnam-red-50 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <article>
            <header className="mb-8">
              <h1 className="text-3xl md:text-5xl font-bold text-vietnam-blue-800 mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback>{post.profiles?.full_name?.[0] || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{post.profiles?.full_name || 'Admin'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </header>

            {post.cover_image_url && (
              <img 
                src={post.cover_image_url} 
                alt={post.title}
                className="w-full aspect-video object-cover rounded-lg mb-8 shadow-lg"
              />
            )}

            <div 
              className="prose prose-lg max-w-none prose-p:text-vietnam-blue-800 prose-headings:text-vietnam-red-600 prose-a:text-vietnam-red-600 hover:prose-a:text-vietnam-red-700 prose-strong:text-vietnam-blue-900"
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