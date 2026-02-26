"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCategories } from "@/hooks/data/useAdminCategories";
import { columns } from "@/components/admin/categories/Columns";
import { CategoriesDataTable } from "@/components/admin/categories/CategoriesDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm, type CategoryFormValues } from "@/components/admin/categories/CategoryForm";
import { Category } from "@/types/database";
import { useCreateCategory, type CreateCategoryData } from "@/hooks/data/useCreateCategory";
import { useUpdateCategory } from "@/hooks/data/useUpdateCategory";
import { useDeleteCategory } from "@/hooks/data/useDeleteCategory";
import { DeleteCategoryDialog } from "@/components/admin/categories/DeleteCategoryDialog";

const AdminCategoriesPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const { data: categories, isLoading, error } = useAdminCategories();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const handleOpenFormDialog = (category: Category | null = null) => {
        setEditingCategory(category);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingCategory(null);
    };

    const handleOpenDeleteDialog = (category: Category) => {
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

    const handleSubmit = (values: CategoryFormValues) => {
        if (editingCategory) {
            updateCategoryMutation.mutate({ id: editingCategory.id, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            // Zod validates required fields; cast needed because z.infer optional ≠ DB null types
            createCategoryMutation.mutate(values as unknown as CreateCategoryData, {
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
                            <CardTitle>Quản lý Danh mục</CardTitle>
                            <CardDescription>Tạo và quản lý các danh mục phân loại địa điểm.</CardDescription>
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
                        <CategoriesDataTable 
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
                    <CategoryForm 
                        category={editingCategory}
                        onSubmit={handleSubmit}
                        isPending={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingCategory && (
                <DeleteCategoryDialog
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

export default AdminCategoriesPage;
