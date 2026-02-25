"use client";

import { usePlaylists } from "@/hooks/data/usePlaylists";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ListMusic } from "lucide-react";

export default function PlaylistsPage() {
  const { data: playlists, isLoading, error } = usePlaylists({ limit: 50 });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ListMusic className="h-8 w-8 text-vietnam-red-600" />
          <h1 className="text-3xl font-bold">Playlist Ẩm Thực</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Mỗi ngày một bộ sưu tập mới - AI gợi ý những địa điểm ăn uống phù hợp nhất cho bạn.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-destructive">
          Không thể tải danh sách playlist. Vui lòng thử lại.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Playlists grid */}
      {playlists && playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {playlists && playlists.length === 0 && (
        <div className="text-center py-16">
          <ListMusic className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có playlist nào</h2>
          <p className="text-muted-foreground">
            Playlist ẩm thực mới sẽ được tạo mỗi ngày. Quay lại sau nhé!
          </p>
        </div>
      )}
    </div>
  );
}
