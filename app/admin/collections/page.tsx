"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    PlusCircle,
    Sparkles,
    Loader2,
    Trash2,
    Star,
    MapPin,
    Calendar,
    Eye,
    EyeOff,
    Archive,
    Pencil,
} from "lucide-react";
import { useAdminCollections } from "@/hooks/data/useAdminCollections";
import { columns } from "@/components/admin/collections/Columns";
import { CollectionsDataTable } from "@/components/admin/collections/CollectionsDataTable";
import { CollectionForm, type CollectionFormValues } from "@/components/admin/collections/CollectionForm";
import { DeleteCollectionDialog } from "@/components/admin/collections/DeleteCollectionDialog";
import { Collection, Playlist, PlaylistStatus } from "@/types/database";
import { useCreateCollection, type CreateCollectionData } from "@/hooks/data/useCreateCollection";
import { useUpdateCollection } from "@/hooks/data/useUpdateCollection";
import { useDeleteCollection } from "@/hooks/data/useDeleteCollection";
import {
    useAdminPlaylists,
    useGeneratePlaylist,
    useUpdatePlaylistStatus,
    useTogglePlaylistFeatured,
    useDeletePlaylist,
} from "@/hooks/data/useAdminPlaylists";
import { PlaylistEditDialog } from "@/components/admin/collections/PlaylistEditDialog";

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

const AdminCollectionsPage = () => {
    // Collections state
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

    // AI playlist state
    const [selectedMood, setSelectedMood] = useState("");
    const [count, setCount] = useState("3");
    const [autoPublish, setAutoPublish] = useState(false);
    const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);
    const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

    // Collections hooks
    const { data: collections, isLoading, error } = useAdminCollections();
    const createCollectionMutation = useCreateCollection();
    const updateCollectionMutation = useUpdateCollection();
    const deleteCollectionMutation = useDeleteCollection();

    // AI playlist hooks
    const { data: playlists, isLoading: isLoadingPlaylists, error: playlistError } = useAdminPlaylists();
    const generateMutation = useGeneratePlaylist();
    const updateStatusMutation = useUpdatePlaylistStatus();
    const toggleFeaturedMutation = useTogglePlaylistFeatured();
    const deletePlaylistMutation = useDeletePlaylist();

    // Collection handlers
    const handleOpenFormDialog = (collection: Collection | null = null) => {
        setEditingCollection(collection);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingCollection(null);
    };

    const handleOpenDeleteDialog = (collection: Collection) => {
        setDeletingCollection(collection);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingCollection(null);
    };

    const handleConfirmDelete = () => {
        if (deletingCollection) {
            deleteCollectionMutation.mutate(deletingCollection.id, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: CollectionFormValues) => {
        if (editingCollection) {
            updateCollectionMutation.mutate({ id: editingCollection.id, ...values }, {
                onSuccess: () => {
                    // Don't close the dialog on metadata update
                    // The user might want to continue managing locations
                },
            });
        } else {
            // Zod validates required fields; cast needed because z.infer optional ≠ DB null types
            createCollectionMutation.mutate(values as unknown as CreateCollectionData, {
                onSuccess: handleCloseFormDialog,
            });
        }
    };

    // AI playlist handlers
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

    const handleDeletePlaylist = () => {
        if (deletingPlaylist) {
            deletePlaylistMutation.mutate(deletingPlaylist.id, {
                onSuccess: () => setDeletingPlaylist(null),
            });
        }
    };

    if (error) {
        return <div>Lỗi: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Manual Collections Section */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Quản lý Bộ sưu tập</CardTitle>
                            <CardDescription>Xem, tạo, sửa và xóa các bộ sưu tập trên trang web.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo bộ sưu tập mới
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <CollectionsDataTable
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })}
                            data={collections || []}
                        />
                    )}
                </CardContent>
            </Card>

            {/* AI Generate Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-vietnam-gold-500" />
                        Tạo bộ sưu tập AI
                    </CardTitle>
                    <CardDescription>
                        AI sẽ tạo bộ sưu tập ẩm thực dựa trên địa điểm trong DB và dữ liệu mới từ Google Maps.
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
                            Tạo bộ sưu tập AI
                        </Button>
                    </div>

                    {/* Generation results */}
                    {generateMutation.isSuccess && generateMutation.data && (
                        <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Đã tạo {generateMutation.data.total} bộ sưu tập:
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

            {/* AI Playlists Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Bộ sưu tập AI ({playlists?.length || 0})
                    </CardTitle>
                    <CardDescription>Quản lý trạng thái, nổi bật và xóa các bộ sưu tập do AI tạo.</CardDescription>
                </CardHeader>
                <CardContent>
                    {playlistError && (
                        <div className="text-destructive text-sm mb-4">Lỗi: {playlistError.message}</div>
                    )}

                    {isLoadingPlaylists && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    )}

                    {playlists && playlists.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                            Chưa có bộ sưu tập AI nào. Bấm &quot;Tạo bộ sưu tập AI&quot; để bắt đầu.
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
                                                onClick={() => handleStatusChange(playlist.id, "published")}
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
                                                onClick={() => handleStatusChange(playlist.id, "archived")}
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
                                                onClick={() => handleStatusChange(playlist.id, "published")}
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
                                            title={playlist.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                                        >
                                            <Star
                                                className={`h-4 w-4 ${
                                                    playlist.is_featured
                                                        ? "fill-vietnam-gold-500 text-vietnam-gold-500"
                                                        : ""
                                                }`}
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingPlaylist(playlist)}
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Separator orientation="vertical" className="h-6 mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletingPlaylist(playlist)}
                                            className="text-destructive hover:text-destructive"
                                            title="Xóa"
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

            {/* Collection Form Dialog */}
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{editingCollection ? 'Chỉnh sửa bộ sưu tập' : 'Tạo bộ sưu tập mới'}</DialogTitle>
                        <DialogDescription>
                            {editingCollection ? 'Cập nhật thông tin và quản lý địa điểm cho bộ sưu tập này.' : 'Điền thông tin để tạo một bộ sưu tập mới. Bạn có thể thêm địa điểm sau khi tạo.'}
                        </DialogDescription>
                    </DialogHeader>
                    <CollectionForm
                        collection={editingCollection}
                        onSubmit={handleSubmit}
                        isPending={createCollectionMutation.isPending || updateCollectionMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Collection Dialog */}
            {deletingCollection && (
                <DeleteCollectionDialog
                    isOpen={!!deletingCollection}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    collectionTitle={deletingCollection.title}
                    isPending={deleteCollectionMutation.isPending}
                />
            )}

            {/* Edit Playlist Dialog */}
            <PlaylistEditDialog
                playlist={editingPlaylist}
                isOpen={!!editingPlaylist}
                onClose={() => setEditingPlaylist(null)}
            />

            {/* Delete Playlist Dialog */}
            <AlertDialog
                open={!!deletingPlaylist}
                onOpenChange={() => setDeletingPlaylist(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa bộ sưu tập AI?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa &quot;{deletingPlaylist?.title}&quot;? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePlaylist}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePlaylistMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCollectionsPage;
