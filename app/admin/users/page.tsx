"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminUsers } from "@/hooks/data/useAdminUsers";
import { columns } from "@/components/admin/users/Columns";
import { UsersDataTable } from "@/components/admin/users/UsersDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileWithRole, AppRole } from "@/types/database";
import { ChangeRoleDialog } from "@/components/admin/users/ChangeRoleDialog";
import { useUpdateUserRole } from "@/hooks/data/useUpdateUserRole";

const AdminUsersPage = () => {
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ProfileWithRole | null>(null);

    const { data: users, isLoading, error } = useAdminUsers();
    const updateUserRoleMutation = useUpdateUserRole();

    const handleOpenRoleDialog = (user: ProfileWithRole) => {
        setSelectedUser(user);
        setIsRoleDialogOpen(true);
    };

    const handleCloseRoleDialog = () => {
        setSelectedUser(null);
        setIsRoleDialogOpen(false);
    };

    const handleConfirmRoleChange = (userId: string, role: AppRole) => {
        updateUserRoleMutation.mutate({ userId, role }, {
            onSuccess: handleCloseRoleDialog,
        });
    };

    if (error) {
        return <div>Lỗi: {error.message}</div>
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý Người dùng</CardTitle>
                    <CardDescription>Xem và quản lý vai trò của tất cả người dùng trong hệ thống.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <UsersDataTable 
                            columns={columns({ onEditRole: handleOpenRoleDialog })} 
                            data={users || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <ChangeRoleDialog
                user={selectedUser}
                isOpen={isRoleDialogOpen}
                onClose={handleCloseRoleDialog}
                onConfirm={handleConfirmRoleChange}
                isPending={updateUserRoleMutation.isPending}
            />
        </>
    );
};

export default AdminUsersPage;
