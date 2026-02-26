"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminTags } from "@/hooks/data/useAdminTags";
import { columns } from "@/components/admin/tags/Columns";
import { TagsDataTable } from "@/components/admin/tags/TagsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagForm, type TagFormValues } from "@/components/admin/tags/TagForm";
import { Tag } from "@/types/database";
import { useCreateTag, type CreateTagData } from "@/hooks/data/useCreateTag";
import { useUpdateTag } from "@/hooks/data/useUpdateTag";
import { useDeleteTag } from "@/hooks/data/useDeleteTag";
import { DeleteTagDialog } from "@/components/admin/tags/DeleteTagDialog";

const AdminTagsPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

    const { data: tags, isLoading, error } = useAdminTags();
    const createTagMutation = useCreateTag();
    const updateTagMutation = useUpdateTag();
    const deleteTagMutation = useDeleteTag();

    const handleOpenFormDialog = (tag: Tag | null = null) => {
        setEditingTag(tag);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingTag(null);
    };

    const handleOpenDeleteDialog = (tag: Tag) => {
        setDeletingTag(tag);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingTag(null);
    };

    const handleConfirmDelete = () => {
        if (deletingTag) {
            deleteTagMutation.mutate(deletingTag.id, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: TagFormValues) => {
        if (editingTag) {
            updateTagMutation.mutate({ id: editingTag.id, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            // Zod validates required fields; cast needed because z.infer optional ≠ DB null types
            createTagMutation.mutate(values as unknown as CreateTagData, {
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
                            <CardTitle>Quản lý Thẻ Tag</CardTitle>
                            <CardDescription>Tạo và quản lý các thẻ tag gắn cho địa điểm.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo thẻ tag mới
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
                        <TagsDataTable 
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })} 
                            data={tags || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTag ? 'Chỉnh sửa thẻ tag' : 'Tạo thẻ tag mới'}</DialogTitle>
                    </DialogHeader>
                    <TagForm 
                        tag={editingTag}
                        onSubmit={handleSubmit}
                        isPending={createTagMutation.isPending || updateTagMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingTag && (
                <DeleteTagDialog
                    isOpen={!!deletingTag}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    tagName={deletingTag.name}
                    isPending={deleteTagMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminTagsPage;
