import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAdminSubmissions } from "@/hooks/data/useAdminSubmissions";
import { columns } from "@/components/admin/submissions/Columns";
import { SubmissionsDataTable } from "@/components/admin/submissions/SubmissionsDataTable";
import { LocationSubmission } from "@/types/database";
import { useUpdateSubmissionStatus } from "@/hooks/data/useUpdateSubmissionStatus";
import { LocationForm } from "@/components/admin/locations/LocationForm";
import { useCreateLocation } from "@/hooks/data/useCreateLocation";

interface SubmissionWithProfile extends LocationSubmission {
  profiles: { full_name: string | null; email: string; } | null;
}

const AdminSubmissionsPage = () => {
    const [viewingSubmission, setViewingSubmission] = useState<SubmissionWithProfile | null>(null);
    const [isCreatingLocation, setIsCreatingLocation] = useState(false);

    const { data: submissions, isLoading, error } = useAdminSubmissions();
    const updateStatusMutation = useUpdateSubmissionStatus();
    const createLocationMutation = useCreateLocation();

    const handleViewSubmission = (submission: SubmissionWithProfile) => {
        setViewingSubmission(submission);
    };

    const handleCloseView = () => {
        setViewingSubmission(null);
    };

    const handleUpdateStatus = (status: 'approved' | 'rejected') => {
        if (viewingSubmission) {
            updateStatusMutation.mutate({ submissionId: viewingSubmission.id, status }, {
                onSuccess: handleCloseView
            });
        }
    };

    const handleApproveAndCreate = () => {
        if (viewingSubmission) {
            updateStatusMutation.mutate({ submissionId: viewingSubmission.id, status: 'approved' });
            setIsCreatingLocation(true);
        }
    };

    const handleLocationFormSubmit = (values: any) => {
        const processedValues = {
            ...values,
            gallery_urls: values.gallery_urls ? values.gallery_urls.split('\n').filter(Boolean) : null,
            opening_hours: values.opening_hours ? JSON.parse(values.opening_hours) : null,
        };
        createLocationMutation.mutate(processedValues, {
            onSuccess: () => {
                setIsCreatingLocation(false);
                handleCloseView();
            }
        });
    };

    if (error) {
        return <div>Lỗi: {error.message}</div>
    }

    const locationInitialData = viewingSubmission ? {
        name: viewingSubmission.name,
        address: viewingSubmission.address,
        district: viewingSubmission.district,
        description: viewingSubmission.description,
    } : null;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý Đóng góp</CardTitle>
                    <CardDescription>Xem và duyệt các địa điểm do người dùng gửi lên.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <SubmissionsDataTable 
                            columns={columns({ onView: handleViewSubmission })} 
                            data={submissions || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!viewingSubmission && !isCreatingLocation} onOpenChange={handleCloseView}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chi tiết đóng góp</DialogTitle>
                        <DialogDescription>Xem lại thông tin và duyệt đóng góp này.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div><span className="font-semibold">Tên:</span> {viewingSubmission?.name}</div>
                        <div><span className="font-semibold">Địa chỉ:</span> {viewingSubmission?.address}</div>
                        <div><span className="font-semibold">Quận:</span> {viewingSubmission?.district}</div>
                        <div><span className="font-semibold">Mô tả:</span> {viewingSubmission?.description || 'Không có'}</div>
                        <div><span className="font-semibold">Ghi chú:</span> {viewingSubmission?.notes || 'Không có'}</div>
                        <div><span className="font-semibold">Người gửi:</span> {viewingSubmission?.profiles?.full_name || viewingSubmission?.profiles?.email}</div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseView}>Đóng</Button>
                        <Button variant="destructive" onClick={() => handleUpdateStatus('rejected')} disabled={updateStatusMutation.isPending}>Từ chối</Button>
                        <Button onClick={handleApproveAndCreate} disabled={updateStatusMutation.isPending}>Duyệt & Tạo địa điểm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreatingLocation} onOpenChange={() => setIsCreatingLocation(false)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tạo địa điểm từ Đóng góp</DialogTitle>
                        <DialogDescription>Kiểm tra và bổ sung thông tin để xuất bản địa điểm.</DialogDescription>
                    </DialogHeader>
                    <LocationForm
                        location={locationInitialData as any}
                        onSubmit={handleLocationFormSubmit}
                        isPending={createLocationMutation.isPending}
                        onClose={() => setIsCreatingLocation(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminSubmissionsPage;