import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminLocations } from "@/hooks/data/useAdminLocations";
import { columns } from "@/components/admin/locations/Columns";
import { LocationsDataTable } from "@/components/admin/locations/LocationsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LocationForm } from "@/components/admin/locations/LocationForm";
import { Location } from "@/types/database";
import { useCreateLocation } from "@/hooks/data/useCreateLocation";
import { useUpdateLocation } from "@/hooks/data/useUpdateLocation";

const AdminLocationsPage = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const { data: locations, isLoading, error } = useAdminLocations();
    const createLocationMutation = useCreateLocation();
    const updateLocationMutation = useUpdateLocation();

    const handleOpenDialog = (location: Location | null = null) => {
        setEditingLocation(location);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingLocation(null);
    };

    const handleSubmit = (values: any) => {
        const processedValues = {
            ...values,
            gallery_urls: values.gallery_urls ? values.gallery_urls.split('\n').filter(Boolean) : null,
            opening_hours: values.opening_hours ? JSON.parse(values.opening_hours) : null,
        };

        if (editingLocation) {
            updateLocationMutation.mutate({ id: editingLocation.id, ...processedValues }, {
                onSuccess: handleCloseDialog,
            });
        } else {
            createLocationMutation.mutate(processedValues, {
                onSuccess: handleCloseDialog,
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
                            <CardTitle>Quản lý Địa điểm</CardTitle>
                            <CardDescription>Xem, tạo, sửa và xóa các địa điểm trên trang web.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Tạo địa điểm mới
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <LocationsDataTable 
                            columns={columns({ onEdit: handleOpenDialog })} 
                            data={locations || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingLocation ? 'Chỉnh sửa địa điểm' : 'Tạo địa điểm mới'}</DialogTitle>
                        <DialogDescription>
                            {editingLocation ? 'Cập nhật thông tin cho địa điểm này.' : 'Điền thông tin để tạo một địa điểm mới.'}
                        </DialogDescription>
                    </DialogHeader>
                    <LocationForm 
                        location={editingLocation}
                        onSubmit={handleSubmit}
                        isPending={createLocationMutation.isPending || updateLocationMutation.isPending}
                        onClose={handleCloseDialog}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminLocationsPage;