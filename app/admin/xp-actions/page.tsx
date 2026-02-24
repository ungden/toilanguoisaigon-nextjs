"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminXpActions } from "@/hooks/data/useAdminXpActions";
import { columns } from "@/components/admin/xp-actions/Columns";
import { XpActionsDataTable } from "@/components/admin/xp-actions/XpActionsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { XpActionForm } from "@/components/admin/xp-actions/XpActionForm";
import { XpAction } from "@/types/database";
import { useUpdateXpAction } from "@/hooks/data/useUpdateXpAction";

const AdminXpActionsPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<XpAction | null>(null);

    const { data: actions, isLoading, error } = useAdminXpActions();
    const updateXpActionMutation = useUpdateXpAction();

    const handleOpenFormDialog = (action: XpAction) => {
        setEditingAction(action);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingAction(null);
    };

    const handleSubmit = (values: any) => {
        if (editingAction) {
            updateXpActionMutation.mutate({ action_name: editingAction.action_name, ...values }, {
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
                    <CardTitle>Quản lý Hành động XP</CardTitle>
                    <CardDescription>Chỉnh sửa điểm kinh nghiệm (XP) cho các hành động của người dùng.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <XpActionsDataTable 
                            columns={columns({ onEdit: handleOpenFormDialog })} 
                            data={actions || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa Hành động XP</DialogTitle>
                    </DialogHeader>
                    {editingAction && (
                        <XpActionForm 
                            action={editingAction}
                            onSubmit={handleSubmit}
                            isPending={updateXpActionMutation.isPending}
                            onClose={handleCloseFormDialog}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminXpActionsPage;
