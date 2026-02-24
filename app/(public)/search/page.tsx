"use client";

import { FilterSidebar, Filters } from "@/components/search/FilterSidebar";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, List, Map } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocations } from "@/hooks/data/useLocations";
import { Location } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useState, FormEvent } from "react";

const SearchPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [filters, setFilters] = useState<Filters>({
    priceRanges: [],
    districts: [],
    categories: [],
  });

  const { data: results, isLoading } = useLocations({
    query,
    limit: 50,
    priceRanges: filters.priceRanges.length > 0 ? filters.priceRanges : undefined,
    districts: filters.districts.length > 0 ? filters.districts : undefined,
  });

  return (
    <div className="container mx-auto flex flex-col lg:flex-row flex-grow w-full">
      <FilterSidebar filters={filters} onFilterChange={setFilters} />
      <div className="flex-grow p-4 lg:p-6">
        <form
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const q = (formData.get("q") as string) || "";
            router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
          }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              name="q"
              placeholder="Tìm kiếm tên quán, món ăn, địa chỉ..."
              className="h-12 text-base pl-10 w-full"
              defaultValue={query}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="List view" type="button">
              <List className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Map view" type="button">
              <Map className="h-5 w-5" />
            </Button>
          </div>
        </form>

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
          ) : results && results.length > 0 ? (
            results.map((place) => (
              <SearchResultCard key={place.id} place={place as Location} />
            ))
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Không tìm thấy kết quả</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
