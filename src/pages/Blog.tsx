import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rss, Send } from "lucide-react";

const BlogPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-vietnam-blue-50">
            <Header />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-16 md:py-24 text-center">
                    <div className="inline-block p-4 bg-vietnam-red-100 rounded-full mb-6">
                        <Rss className="h-12 w-12 text-vietnam-red-600" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-vietnam-blue-800 mb-4">
                        Blog sắp ra mắt!
                    </h1>
                    <p className="text-lg md:text-xl text-vietnam-blue-600 max-w-3xl mx-auto mb-12">
                        Chúng tôi đang chuẩn bị những bài viết hấp dẫn, những câu chuyện ẩm thực độc đáo và những bài đánh giá chuyên sâu về Sài Gòn. Hãy là người đầu tiên nhận được thông báo khi blog ra mắt!
                    </p>
                    <div className="max-w-lg mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-vietnam-blue-200">
                            <Input
                                type="email"
                                name="email"
                                placeholder="Nhập email của bạn..."
                                className="h-12 text-base bg-white border-vietnam-blue-300 focus:border-vietnam-red-500"
                            />
                            <Button type="submit" size="lg" className="h-12 px-6 btn-vietnam">
                                <Send className="h-5 w-5 mr-2" />
                                Đăng ký
                            </Button>
                        </div>
                        <p className="text-xs text-vietnam-blue-500 mt-3">
                            Chúng tôi tôn trọng quyền riêng tư của bạn và sẽ không gửi thư rác.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPage;