import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Rss } from "lucide-react";

const BlogPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="text-center py-16">
                    <Rss className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Blog & Reviews</h1>
                    <p className="mt-6 text-base leading-7 text-muted-foreground">Nơi chia sẻ những câu chuyện và góc nhìn sâu sắc về ẩm thực Sài Gòn. <br/> Tính năng này sẽ sớm được ra mắt!</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPage;