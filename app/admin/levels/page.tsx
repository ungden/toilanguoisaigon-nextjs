"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLevels } from "@/hooks/data/useLevels";
import { columns } from "@/components/admin/levels/Columns";
import { LevelsDataTable } from "@/components/admin/levels/LevelsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LevelForm } from "@/components/admin/levels/LevelForm";
import { Level } from "@/types/database";
import { useCreateLevel } from "@/hooks/data/useCreateLevel";
import { useUpdateLevel } from "@/hooks/data/useUpdateLevel";
import { useDeleteLevel } from "@/hooks/data/useDeleteLevel";
import { DeleteLevelDialog } from "@/components/admin/levels/DeleteLevelDialog";

const AdminLevelsPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [deletingLevel, setDeletingLevel] = useState<Level | null>(null);

    const { data: levels, isLoading, error } = useLevels();
    const createLevelMutation = useCreateLevel();
    const updateLevelMutation = useUpdateLevel();
    const deleteLevelMutation = useDeleteLevel();

    const handleOpenFormDialog = (level: Level | null = null) => {
        setEditingLevel(level);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingLevel(null);
    };

    const handleOpenDeleteDialog = (level: Level) => {
        setDeletingLevel(level);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingLevel(null);
    };

    const handleConfirmDelete = () => {
        if (deletingLevel) {
            deleteLevelMutation.mutate(deletingLevel.level, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: any) => {
        if (editingLevel) {
            updateLevelMutation.mutate({ level: editingLevel.level, ...values }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            createLevelMutation.mutate(values, {
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
                            <CardTitle>Quản lý Cấp độ</CardTitle>
                            <CardDescription>Thiết lập các cấp độ và điểm kinh nghiệm yêu cầu cho người dùng.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo cấp độ mới
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
                        <LevelsDataTable 
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })} 
                            data={levels || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLevel ? 'Chỉnh sửa cấp độ' : 'Tạo cấp độ mới'}</DialogTitle>
                    </DialogHeader>
                    <LevelForm 
                        level={editingLevel}
                        onSubmit={handleSubmit}
                        isPending={createLevelMutation.isPending || updateLevelMutation.isPending}
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingLevel && (
                <DeleteLevelDialog
                    isOpen={!!deletingLevel}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    levelTitle={deletingLevel.title}
                    isPending={deleteLevelMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminLevelsPage;
