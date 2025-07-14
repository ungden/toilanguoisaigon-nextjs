import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Bookmark } from "lucide-react";

const MyNotebookPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="text-center py-16">
                    <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Sổ tay của tôi</h1>
                    <p className="mt-6 text-base leading-7 text-muted-foreground">Đây là nơi hiển thị các địa điểm bạn đã lưu. <br/> Tính năng này sẽ sớm được cập nhật!</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MyNotebookPage;