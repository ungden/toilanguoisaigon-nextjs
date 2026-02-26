"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Playlist } from "@/types/database";
import { useUpdatePlaylist } from "@/hooks/data/useUpdatePlaylist";

const MOOD_OPTIONS = [
  { value: "none", label: "Không có" },
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

interface PlaylistEditDialogProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistEditDialog({ playlist, isOpen, onClose }: PlaylistEditDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [mood, setMood] = useState("none");
  const [emoji, setEmoji] = useState("");
  const updatePlaylistMutation = useUpdatePlaylist();

  useEffect(() => {
    if (playlist) {
      setTitle(playlist.title);
      setDescription(playlist.description || "");
      setCoverImageUrl(playlist.cover_image_url || "");
      setMood(playlist.mood || "none");
      setEmoji(playlist.emoji || "");
    }
  }, [playlist]);

  const handleSave = () => {
    if (!playlist) return;
    updatePlaylistMutation.mutate(
      {
        id: playlist.id,
        title,
        description: description || null,
        cover_image_url: coverImageUrl || null,
        mood: mood === "none" ? null : (mood as Playlist["mood"]),
        emoji: emoji || null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bộ sưu tập AI</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho &quot;{playlist?.title}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="playlist-title">Tiêu đề</Label>
            <Input
              id="playlist-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="playlist-description">Mô tả</Label>
            <Textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả..."
              rows={3}
            />
          </div>

          {/* Cover Image URL */}
          <div className="space-y-2">
            <Label htmlFor="playlist-cover">Ảnh bìa (URL)</Label>
            <Input
              id="playlist-cover"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mood */}
            <div className="space-y-2">
              <Label>Chủ đề</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chủ đề" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label htmlFor="playlist-emoji">Emoji</Label>
              <Input
                id="playlist-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🍜"
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={updatePlaylistMutation.isPending || !title.trim()}>
            {updatePlaylistMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
