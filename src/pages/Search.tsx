import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, List, Map } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useLocations } from "@/hooks/data/useLocations";
import { Location } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { data: results, isLoading } = useLocations({ query, limit: 20 });

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
            {isLoading ? <Skeleton className="h-8 w-48" /> : `${results?.length || 0} Kết quả ${query && `cho "${query}"`}`}
          </h2>
          
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="flex flex-col sm:flex-row overflow-hidden w-full">
                  <Skeleton className="w-full sm:w-48 h-48 sm:h-auto object-cover flex-shrink-0" />
                  <CardContent className="p-4 flex-grow space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4 mt-4" />
                  </CardContent>
                </Card>
              ))
            ) : (
              results?.map((place) => (
                <SearchResultCard key={place.id} place={place as Location} />
              ))
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;