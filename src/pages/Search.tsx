import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { SearchResultCard, SearchResult } from "@/components/search/SearchResultCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, List, Map } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const mockResults: SearchResult[] = [
  { name: "Phở Haru", slug: "pho-haru", district: "Quận 1", image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop", rating: 4.8, reviewCount: 120, cuisine: "Món Việt", priceRange: "100k - 200k" },
  { name: "The Running Bean", slug: "the-running-bean", district: "Quận 3", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop", rating: 4.5, reviewCount: 350, cuisine: "Café", priceRange: "50k - 150k" },
  { name: "Bún Chả Quán", slug: "bun-cha-quan", district: "Phú Nhuận", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1964&auto=format&fit=crop", rating: 4.7, reviewCount: 215, cuisine: "Món Việt", priceRange: "50k - 100k" },
  { name: "Cơm Tấm Ba Ghiền", slug: "com-tam-ba-ghien", district: "Bình Thạnh", image: "https://images.unsplash.com/photo-1598515599465-f36719464717?q=80&w=2070&auto=format&fit=crop", rating: 4.9, reviewCount: 890, cuisine: "Món Việt", priceRange: "50k - 100k" },
  { name: "Sushi Tei", slug: "sushi-tei", district: "Quận 1", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop", rating: 4.6, reviewCount: 430, cuisine: "Món Nhật", priceRange: "300k - 500k" },
  { name: "El Gaucho Argentinian Steakhouse", slug: "el-gaucho", district: "Quận 1", image: "https://images.unsplash.com/photo-1546824294-1671459746b9?q=80&w=2070&auto=format&fit=crop", rating: 4.8, reviewCount: 600, cuisine: "Món Âu", priceRange: "> 500k" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto flex flex-col lg:flex-row flex-grow w-full">
        <FilterSidebar />
        <main className="flex-grow p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm tên quán, món ăn, địa chỉ..."
                className="h-12 text-base pl-10 w-full"
                defaultValue={query}
              />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="List view">
                    <List className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Map view">
                    <Map className="h-5 w-5" />
                </Button>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">
            {mockResults.length} Kết quả {query && `cho "${query}"`}
          </h2>
          
          <div className="space-y-4">
            {mockResults.map((place) => (
              <SearchResultCard key={place.name} place={place} />
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;