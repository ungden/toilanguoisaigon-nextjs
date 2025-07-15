import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPosts } from "@/hooks/data/useAdminPosts";
import { columns } from "@/components/admin/posts/Columns";
import { PostsDataTable } from "@/components/admin/posts/PostsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PostForm } from "@/components/admin/posts/PostForm";
import { Post } from "@/types/database";
import { useCreatePost } from "@/hooks/data/useCreatePost";
import { useUpdatePost } from "@/hooks/data/useUpdatePost";
import { useDeletePost } from "@/hooks/data/useDeletePost";
import { DeletePostDialog } from "@/components/admin/posts/DeletePostDialog";
import { useAuth } from "@/contexts/AuthContext";

const AdminPostsPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [deletingPost, setDeletingPost] = useState<Post | null>(null);
    
    const { user } = useAuth();
    const { data: posts, isLoading, error } = useAdminPosts();
    const createPostMutation = useCreatePost();
    const updatePostMutation = useUpdatePost();
    const deletePostMutation = useDeletePost();

    const handleOpenFormDialog = (post: Post | null = null) => {
        setEditingPost(post);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingPost(null);
    };

    const handleOpenDeleteDialog = (post: Post) => {
        setDeletingPost(post);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingPost(null);
    };

    const handleConfirmDelete = () => {
        if (deletingPost) {
            deletePostMutation.mutate(deletingPost.id, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: any) => {
        if (editingPost) {
            updatePostMutation.mutate({ id: editingPost.id, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            createPostMutation.mutate({ ...values, author_id: user?.id }, {
                onSuccess: handleCloseFormDialog,
            });
        }
    };

    if (error) {
        return <div>Lỗi: {error.message}</div>
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Quản lý Bài viết</CardTitle>
                            <CardDescription>Xem, tạo, sửa và xóa các bài viết trên trang web.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo bài viết mới
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
                        <PostsDataTable 
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })} 
                            data={posts || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</DialogTitle>
                        <DialogDescription>
                            {editingPost ? 'Cập nhật thông tin cho bài viết này.' : 'Điền thông tin để tạo một bài viết mới.'}
                        </DialogDescription>
                    </DialogHeader>
                    <PostForm 
                        post={editingPost}
                        onSubmit={handleSubmit}
                        isPending={createPostMutation.isPending || updatePostMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingPost && (
                <DeletePostDialog
                    isOpen={!!deletingPost}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    postTitle={deletingPost.title}
                    isPending={deletePostMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminPostsPage;