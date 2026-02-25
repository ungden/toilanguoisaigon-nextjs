"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ListMusic,
  Sparkles,
  Loader2,
  Trash2,
  Star,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Archive,
} from "lucide-react";
import {
  useAdminPlaylists,
  useGeneratePlaylist,
  useUpdatePlaylistStatus,
  useTogglePlaylistFeatured,
  useDeletePlaylist,
} from "@/hooks/data/useAdminPlaylists";
import { Playlist, PlaylistStatus } from "@/types/database";

const MOOD_OPTIONS = [
  { value: "", label: "Tự động (AI chọn)" },
  { value: "morning", label: "Buổi sáng" },
  { value: "lunch", label: "Bữa trưa" },
  { value: "dinner", label: "Bữa tối" },
  { value: "late-night", label: "Đêm khuya" },
  { value: "rainy-day", label: "Ngày mưa" },
  { value: "weekend", label: "Cuối tuần" },
  { value: "date-night", label: "Hẹn hò" },
  { value: "family", label: "Gia đình" },
  { value: "budget", label: "Tiết kiệm" },
  { value: "premium", label: "Sang chảnh" },
  { value: "adventure", label: "Khám phá" },
  { value: "comfort", label: "Comfort food" },
  { value: "healthy", label: "Healthy" },
  { value: "street-food", label: "Đường phố" },
  { value: "seasonal", label: "Theo mùa" },
];

const STATUS_LABELS: Record<PlaylistStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Nháp", variant: "secondary" },
  published: { label: "Đã xuất bản", variant: "default" },
  archived: { label: "Lưu trữ", variant: "outline" },
};

export default function AdminPlaylistsPage() {
  const [selectedMood, setSelectedMood] = useState("");
  const [count, setCount] = useState("3");
  const [autoPublish, setAutoPublish] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);

  const { data: playlists, isLoading, error } = useAdminPlaylists();
  const generateMutation = useGeneratePlaylist();
  const updateStatusMutation = useUpdatePlaylistStatus();
  const toggleFeaturedMutation = useTogglePlaylistFeatured();
  const deleteMutation = useDeletePlaylist();

  const handleGenerate = () => {
    generateMutation.mutate({
      mood: selectedMood || undefined,
      count: parseInt(count, 10),
      auto_publish: autoPublish,
    });
  };

  const handleStatusChange = (id: string, status: PlaylistStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleToggleFeatured = (playlist: Playlist) => {
    toggleFeaturedMutation.mutate({
      id: playlist.id,
      is_featured: !playlist.is_featured,
    });
  };

  const handleDelete = () => {
    if (deletingPlaylist) {
      deleteMutation.mutate(deletingPlaylist.id, {
        onSuccess: () => setDeletingPlaylist(null),
      });
    }
  };

  if (error) {
    return <div className="text-destructive">Lỗi: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Generate new playlists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-vietnam-gold-500" />
            Tạo Playlist mới bằng AI
          </CardTitle>
          <CardDescription>
            AI sẽ tạo playlist ẩm thực dựa trên địa điểm trong DB và dữ liệu
            mới từ Google Maps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Chủ đề</label>
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tự động" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value || "auto"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Số lượng</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-publish"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="auto-publish" className="text-sm">
                Tự động xuất bản
              </label>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Tạo Playlist
            </Button>
          </div>

          {/* Generation results */}
          {generateMutation.isSuccess && generateMutation.data && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Đã tạo {generateMutation.data.total} playlist:
              </p>
              <ul className="mt-1 space-y-1">
                {generateMutation.data.playlists.map((pl) => (
                  <li key={pl.id} className="text-sm text-green-700 dark:text-green-300">
                    {pl.emoji} {pl.title} ({pl.location_count} địa điểm
                    {pl.new_locations_created > 0
                      ? `, ${pl.new_locations_created} mới từ Maps`
                      : ""}
                    )
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playlists list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5" />
            Quản lý Playlist ({playlists?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {playlists && playlists.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Chưa có playlist nào. Bấm &quot;Tạo Playlist&quot; để bắt đầu.
            </p>
          )}

          <div className="space-y-3">
            {playlists?.map((playlist) => {
              const statusInfo = STATUS_LABELS[playlist.status as PlaylistStatus] || STATUS_LABELS.draft;

              return (
                <div
                  key={playlist.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  {/* Emoji */}
                  <div className="text-2xl flex-shrink-0 w-10 text-center">
                    {playlist.emoji || "🍽️"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{playlist.title}</h3>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      {playlist.is_featured && (
                        <Badge
                          variant="default"
                          className="bg-vietnam-gold-500"
                        >
                          Nổi bật
                        </Badge>
                      )}
                      {playlist.mood && (
                        <Badge variant="outline" className="text-xs">
                          {playlist.mood}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {playlist.location_count} địa điểm
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {playlist.generated_date}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {playlist.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(playlist.id, "published")
                        }
                        disabled={updateStatusMutation.isPending}
                        title="Xuất bản"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {playlist.status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(playlist.id, "archived")
                        }
                        disabled={updateStatusMutation.isPending}
                        title="Lưu trữ"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    {playlist.status === "archived" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(playlist.id, "published")
                        }
                        disabled={updateStatusMutation.isPending}
                        title="Xuất bản lại"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(playlist)}
                      disabled={toggleFeaturedMutation.isPending}
                      title={
                        playlist.is_featured
                          ? "Bỏ nổi bật"
                          : "Đánh dấu nổi bật"
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          playlist.is_featured
                            ? "fill-vietnam-gold-500 text-vietnam-gold-500"
                            : ""
                        }`}
                      />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPlaylist(playlist)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingPlaylist}
        onOpenChange={() => setDeletingPlaylist(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa &quot;{deletingPlaylist?.title}&quot;? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
