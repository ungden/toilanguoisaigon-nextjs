import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCollections } from "@/hooks/data/useAdminCollections";
import { columns } from "@/components/admin/collections/Columns";
import { CollectionsDataTable } from "@/components/admin/collections/CollectionsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CollectionForm } from "@/components/admin/collections/CollectionForm";
import { Collection } from "@/types/database";
import { useCreateCollection } from "@/hooks/data/useCreateCollection";
import { useUpdateCollection } from "@/hooks/data/useUpdateCollection";
import { useDeleteCollection } from "@/hooks/data/useDeleteCollection";
import { DeleteCollectionDialog } from "@/components/admin/collections/DeleteCollectionDialog";

const AdminCollectionsPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

    const { data: collections, isLoading, error } = useAdminCollections();
    const createCollectionMutation = useCreateCollection();
    const updateCollectionMutation = useUpdateCollection();
    const deleteCollectionMutation = useDeleteCollection();

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

    const handleSubmit = (values: any) => {
        if (editingCollection) {
            updateCollectionMutation.mutate({ id: editingCollection.id, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            createCollectionMutation.mutate(values, {
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

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingCollection ? 'Chỉnh sửa bộ sưu tập' : 'Tạo bộ sưu tập mới'}</DialogTitle>
                        <DialogDescription>
                            {editingCollection ? 'Cập nhật thông tin cho bộ sưu tập này.' : 'Điền thông tin để tạo một bộ sưu tập mới.'}
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

            {deletingCollection && (
                <DeleteCollectionDialog
                    isOpen={!!deletingCollection}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    collectionTitle={deletingCollection.title}
                    isPending={deleteCollectionMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminCollectionsPage;