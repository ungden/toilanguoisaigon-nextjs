import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedLocations } from "@/hooks/data/useSavedLocations";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MyNotebookPage = () => {
    const { user, loading: authLoading } = useAuth();
    const { data: savedLocations, isLoading: locationsLoading, error: locationsError } = useSavedLocations(user?.id);

    const isLoading = authLoading || locationsLoading;

    if (locationsError) {
        console.error("Error fetching saved locations:", locationsError);
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Lỗi tải sổ tay</h1>
                        <p className="mt-6 text-base leading-7 text-muted-foreground">Không thể tải các địa điểm đã lưu. Vui lòng thử lại sau.</p>
                        <Button onClick={() => window.location.reload()} className="mt-4">Tải lại trang</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Sổ tay của tôi</h1>
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="flex flex-col sm:flex-row overflow-hidden w-full">
                                <Skeleton className="w-full sm:w-48 h-48 sm:h-auto object-cover flex-shrink-0" />
                                <CardContent className="p-4 flex-grow space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/4 mt-4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : savedLocations && savedLocations.length > 0 ? (
                    <div className="space-y-4">
                        {savedLocations.map((place) => (
                            <SearchResultCard key={place.id} place={place} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Sổ tay của bạn trống</h2>
                        <p className="mt-2 text-base leading-7 text-muted-foreground">
                            Bạn chưa lưu địa điểm nào. Hãy khám phá và thêm những địa điểm yêu thích vào đây!
                        </p>
                        <Button asChild className="mt-6 btn-vietnam">
                            <Link to="/search">Khám phá địa điểm</Link>
                        </Button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default MyNotebookPage;