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
import { useDeleteLocation } from "@/hooks/data/useDeleteLocation";
import { DeleteLocationDialog } from "@/components/admin/locations/DeleteLocationDialog";

const AdminLocationsPage = () => {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

    const { data: locations, isLoading, error } = useAdminLocations();
    const createLocationMutation = useCreateLocation();
    const updateLocationMutation = useUpdateLocation();
    const deleteLocationMutation = useDeleteLocation();

    const handleOpenFormDialog = (location: Location | null = null) => {
        setEditingLocation(location);
        setIsFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false);
        setEditingLocation(null);
    };

    const handleOpenDeleteDialog = (location: Location) => {
        setDeletingLocation(location);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingLocation(null);
    };

    const handleConfirmDelete = () => {
        if (deletingLocation) {
            deleteLocationMutation.mutate(deletingLocation.id, {
                onSuccess: handleCloseDeleteDialog,
            });
        }
    };

    const handleSubmit = (values: any) => {
        const processedValues = {
            ...values,
            gallery_urls: values.gallery_urls ? values.gallery_urls.split('\n').filter(Boolean) : null,
            opening_hours: values.opening_hours ? JSON.parse(values.opening_hours) : null,
        };

        if (editingLocation) {
            updateLocationMutation.mutate({ id: editingLocation.id, ...processedValues }, {
                onSuccess: handleCloseFormDialog,
            });
        } else {
            createLocationMutation.mutate(processedValues, {
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
                            <CardTitle>Quản lý Địa điểm</CardTitle>
                            <CardDescription>Xem, tạo, sửa và xóa các địa điểm trên trang web.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenFormDialog()}>
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
                            columns={columns({ onEdit: handleOpenFormDialog, onDelete: handleOpenDeleteDialog })} 
                            data={locations || []} 
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
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
                        onClose={handleCloseFormDialog}
                    />
                </DialogContent>
            </Dialog>

            {deletingLocation && (
                <DeleteLocationDialog
                    isOpen={!!deletingLocation}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    locationName={deletingLocation.name}
                    isPending={deleteLocationMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminLocationsPage;