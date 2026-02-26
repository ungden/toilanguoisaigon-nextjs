"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCollectionCategories } from "@/hooks/data/useAdminCollectionCategories";
import { columns } from "@/components/admin/collection-categories/Columns";
import { CollectionCategoriesDataTable } from "@/components/admin/collection-categories/CollectionCategoriesDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CollectionCategoryForm, type CollectionCategoryFormValues } from "@/components/admin/collection-categories/CollectionCategoryForm";
import { CollectionCategory } from "@/types/database";
import { useCreateCollectionCategory, type CreateCollectionCategoryData } from "@/hooks/data/useCreateCollectionCategory";
import { useUpdateCollectionCategory } from "@/hooks/data/useUpdateCollectionCategory";
import { useDeleteCollectionCategory } from "@/hooks/data/useDeleteCollectionCategory";
import { DeleteCollectionCategoryDialog } from "@/components/admin/collection-categories/DeleteCollectionCategoryDialog";

const AdminCollectionCategoriesPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CollectionCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CollectionCategory | null>(null);

    const { data: categories, isLoading, error } = useAdminCollectionCategories();
    const createCategoryMutation = useCreateCollectionCategory();
    const updateCategoryMutation = useUpdateCollectionCategory();
    const deleteCategoryMutation = useDeleteCollectionCategory();

    const handleOpenFormDialog = (category: CollectionCategory | null = null) => {
        setEditingCategory(category);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingCategory(null);
    };

    const handleOpenDeleteDialog = (category: CollectionCategory) => {
        setDeletingCategory(category);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingCategory(null);
    };

    const handleConfirmDelete = () => {
        if (deletingCategory) {
            deleteCategoryMutation.mutate(deletingCategory.id, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: CollectionCategoryFormValues) => {
        if (editingCategory) {
            updateCategoryMutation.mutate({ id: editingCategory.id, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            // Zod validates required fields; cast needed because z.infer optional ≠ DB null types
            createCategoryMutation.mutate(values as unknown as CreateCollectionCategoryData, {
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
                            <CardTitle>Quản lý Danh mục Bộ sưu tập</CardTitle>
                            <CardDescription>Tạo và quản lý các danh mục phân loại bộ sưu tập.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo danh mục mới
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <CollectionCategoriesDataTable 
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })} 
                            data={categories || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}</DialogTitle>
                    </DialogHeader>
                    <CollectionCategoryForm 
                        category={editingCategory}
                        onSubmit={handleSubmit}
                        isPending={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingCategory && (
                <DeleteCollectionCategoryDialog
                    isOpen={!!deletingCategory}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    categoryName={deletingCategory.name}
                    isPending={deleteCategoryMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminCollectionCategoriesPage;
