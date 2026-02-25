"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  ExternalLink,
  Download,
  Loader2,
  AlertTriangle,
  Star,
  MessageSquare,
} from "lucide-react";
import {
  useGoogleMapsSearch,
  useImportLocations,
  MapsImportLocation,
} from "@/hooks/data/useGoogleMapsImport";

const SUGGESTED_QUERIES = [
  "Quán phở ngon nhất Sài Gòn",
  "Quán cà phê đẹp quận 1",
  "Quán bún bò Huế quận 3",
  "Nhà hàng hải sản quận 7",
  "Quán ăn vỉa hè nổi tiếng Sài Gòn",
  "Tiệm bánh mì Sài Gòn",
  "Rooftop bar Thảo Điền",
  "Quán chay ngon Sài Gòn",
];

export default function ImportMapsPage() {
  const [query, setQuery] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<MapsImportLocation[]>([]);

  const searchMutation = useGoogleMapsSearch();
  const importMutation = useImportLocations();

  const handleSearch = () => {
    if (!query.trim()) return;
    setSelectedIndices(new Set());
    setResults([]);
    searchMutation.mutate(
      { query: query.trim() },
      {
        onSuccess: (data) => {
          setResults(data.locations);
        },
      }
    );
  };

  const handleSuggestedQuery = (q: string) => {
    setQuery(q);
    setSelectedIndices(new Set());
    setResults([]);
    searchMutation.mutate(
      { query: q },
      {
        onSuccess: (data) => {
          setResults(data.locations);
        },
      }
    );
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === results.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(results.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const selected = results.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) return;
    importMutation.mutate(selected, {
      onSuccess: () => {
        // Remove imported items from results
        setResults((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
        setSelectedIndices(new Set());
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-vietnam-red-600" />
            Import địa điểm từ Google Maps
          </CardTitle>
          <CardDescription>
            Tìm kiếm địa điểm qua Google Maps (thông qua Gemini AI) và import vào hệ thống.
            Các địa điểm sẽ được tạo với trạng thái &quot;draft&quot; để bạn review trước khi publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ví dụ: quán phở ngon quận 1, cà phê rooftop Thảo Điền..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searchMutation.isPending || !query.trim()}
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Tìm kiếm
            </Button>
          </div>

          {/* Suggested queries */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">Gợi ý:</span>
            {SUGGESTED_QUERIES.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuery(q)}
                disabled={searchMutation.isPending}
              >
                {q}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {searchMutation.isPending && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tìm kiếm trên Google Maps...</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {searchMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{searchMutation.error?.message || "Đã xảy ra lỗi."}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Kết quả: {results.length} địa điểm
                </CardTitle>
                <CardDescription>
                  Chọn các địa điểm bạn muốn import vào hệ thống.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedIndices.size === results.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    selectedIndices.size === 0 || importMutation.isPending
                  }
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Import {selectedIndices.size > 0 ? `(${selectedIndices.size})` : ""}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((loc, index) => (
              <div
                key={`${loc.name}-${index}`}
                className={`flex gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedIndices.has(index)
                    ? "border-vietnam-red-500 bg-vietnam-red-50 dark:bg-vietnam-red-950/20"
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => toggleSelect(index)}
              >
                <div className="pt-1">
                  <Checkbox
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => toggleSelect(index)}
                    aria-label={`Chọn ${loc.name}`}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{loc.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {loc.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {loc.price_range && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {loc.price_range}
                        </Badge>
                      )}
                      <Badge variant="outline">{loc.district}</Badge>
                    </div>
                  </div>

                  {/* Google Rating */}
                  {(loc.google_rating || loc.google_review_count) && (
                    <div className="flex items-center gap-3 text-sm">
                      {loc.google_rating && (
                        <span className="flex items-center gap-1 font-medium text-vietnam-gold-600">
                          <Star className="h-3.5 w-3.5 fill-vietnam-gold-500 text-vietnam-gold-500" />
                          {loc.google_rating.toFixed(1)}
                        </span>
                      )}
                      {loc.google_review_count && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {loc.google_review_count.toLocaleString()} reviews trên <span translate="no">Google</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Google Review Summary */}
                  {loc.google_review_summary && (
                    <div className="text-sm bg-muted/50 rounded-md p-2.5 border-l-2 border-vietnam-gold-400">
                      <p className="text-muted-foreground italic">
                        &ldquo;{loc.google_review_summary}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Google Highlights */}
                  {loc.google_highlights && loc.google_highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {loc.google_highlights.map((highlight, hi) => (
                        <Badge
                          key={hi}
                          variant="outline"
                          className="text-xs bg-vietnam-gold-50 text-vietnam-gold-700 border-vietnam-gold-200"
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {loc.description && (
                    <p className="text-sm text-muted-foreground">
                      {loc.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {loc.phone_number && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {loc.phone_number}
                      </span>
                    )}
                    {loc.opening_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Có giờ mở cửa
                      </span>
                    )}
                    {loc.google_maps_uri && (
                      <a
                        href={loc.google_maps_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-vietnam-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span translate="no">Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Import results */}
          {importMutation.isSuccess && importMutation.data && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Kết quả import:</h4>
                <div className="space-y-1">
                  {importMutation.data.map((result, i) => (
                    <div
                      key={i}
                      className={`text-sm flex items-center gap-2 ${
                        result.success
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive"
                      }`}
                    >
                      <span>{result.success ? "✓" : "✗"}</span>
                      <span>{result.name}</span>
                      {result.error && (
                        <span className="text-xs text-muted-foreground">
                          ({result.error})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}

      {/* Empty state after search */}
      {searchMutation.isSuccess && results.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Không tìm thấy địa điểm nào cho truy vấn này.</p>
            <p className="text-sm mt-1">Thử lại với từ khóa khác.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
