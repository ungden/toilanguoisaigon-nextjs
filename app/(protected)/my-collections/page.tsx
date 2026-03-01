"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUserCollections,
  useCreateUserCollection,
  useDeleteUserCollection,
} from "@/hooks/data/useUserCollections";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FolderHeart, Plus, MapPin, Trash2, Globe, Lock } from "lucide-react";
import Link from "next/link";

export default function MyCollectionsPage() {
  const { user } = useAuth();
  const { data: collections, isLoading } = useUserCollections(user?.id);
  const createCollection = useCreateUserCollection();
  const deleteCollection = useDeleteUserCollection();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!user || !newTitle.trim()) return;
    createCollection.mutate(
      { userId: user.id, data: { title: newTitle.trim(), description: newDescription.trim() || undefined } },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewDescription("");
          setIsDialogOpen(false);
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-vietnam-blue-800 flex items-center gap-3">
            <FolderHeart className="h-8 w-8 text-vietnam-red-600" />
            Bộ sưu tập của tôi
          </h1>
          <p className="text-vietnam-blue-600 mt-1">
            Tạo và quản lý các bộ sưu tập địa điểm yêu thích
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-vietnam">
              <Plus className="h-4 w-4 mr-2" />
              Tạo mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo bộ sưu tập mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tên bộ sưu tập</label>
                <Input
                  placeholder="Ví dụ: Quán cà phê yêu thích"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mô tả (tùy chọn)</label>
                <Textarea
                  placeholder="Mô tả ngắn về bộ sưu tập này..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={300}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button
                className="btn-vietnam"
                onClick={handleCreate}
                disabled={!newTitle.trim() || createCollection.isPending}
              >
                {createCollection.isPending ? "Đang tạo..." : "Tạo bộ sưu tập"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="border-vietnam-blue-200 hover:border-vietnam-red-300 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link href={`/my-collections/${collection.id}`} className="flex-1">
                    <CardTitle className="text-lg text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors line-clamp-1">
                      {collection.title}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-1 ml-2">
                    {collection.is_public ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">
                        <Globe className="h-2.5 w-2.5 mr-0.5" />
                        Công khai
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 border-slate-300 text-[10px]">
                        <Lock className="h-2.5 w-2.5 mr-0.5" />
                        Riêng tư
                      </Badge>
                    )}
                  </div>
                </div>
                {collection.description && (
                  <CardDescription className="line-clamp-2 mt-1">{collection.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-vietnam-blue-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {collection.location_count || 0} địa điểm
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa bộ sưu tập?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa &quot;{collection.title}&quot;? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCollection.mutate(collection.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderHeart className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="mt-4 text-2xl font-bold text-vietnam-blue-800">Chưa có bộ sưu tập nào</h2>
          <p className="mt-2 text-vietnam-blue-600 max-w-md mx-auto">
            Tạo bộ sưu tập để lưu và chia sẻ những địa điểm yêu thích của bạn với bạn bè.
          </p>
          <Button className="btn-vietnam mt-6" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo bộ sưu tập đầu tiên
          </Button>
        </div>
      )}
    </div>
  );
}
