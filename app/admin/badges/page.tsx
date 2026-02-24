"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminBadges } from "@/hooks/data/useAdminBadges";
import { columns } from "@/components/admin/badges/Columns";
import { BadgesDataTable } from "@/components/admin/badges/BadgesDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeForm } from "@/components/admin/badges/BadgeForm";
import { Badge } from "@/types/database";
import { useCreateBadge } from "@/hooks/data/useCreateBadge";
import { useUpdateBadge } from "@/hooks/data/useUpdateBadge";
import { useDeleteBadge } from "@/hooks/data/useDeleteBadge";
import { DeleteBadgeDialog } from "@/components/admin/badges/DeleteBadgeDialog";

const AdminBadgesPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [deletingBadge, setDeletingBadge] = useState<Badge | null>(null);

    const { data: badges, isLoading, error } = useAdminBadges();
    const createBadgeMutation = useCreateBadge();
    const updateBadgeMutation = useUpdateBadge();
    const deleteBadgeMutation = useDeleteBadge();

    const handleOpenFormDialog = (badge: Badge | null = null) => {
        setEditingBadge(badge);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingBadge(null);
    };

    const handleOpenDeleteDialog = (badge: Badge) => {
        setDeletingBadge(badge);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingBadge(null);
    };

    const handleConfirmDelete = () => {
        if (deletingBadge) {
            deleteBadgeMutation.mutate(deletingBadge.id, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: any) => {
        if (editingBadge) {
            updateBadgeMutation.mutate({ id: editingBadge.id, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            createBadgeMutation.mutate(values, {
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
                            <CardTitle>Quản lý Huy hiệu</CardTitle>
                            <CardDescription>Tạo và quản lý các huy hiệu thưởng cho người dùng.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo huy hiệu mới
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
                        <BadgesDataTable 
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })} 
                            data={badges || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBadge ? 'Chỉnh sửa huy hiệu' : 'Tạo huy hiệu mới'}</DialogTitle>
                    </DialogHeader>
                    <BadgeForm 
                        badge={editingBadge}
                        onSubmit={handleSubmit}
                        isPending={createBadgeMutation.isPending || updateBadgeMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingBadge && (
                <DeleteBadgeDialog
                    isOpen={!!deletingBadge}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    badgeName={deletingBadge.name}
                    isPending={deleteBadgeMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminBadgesPage;
