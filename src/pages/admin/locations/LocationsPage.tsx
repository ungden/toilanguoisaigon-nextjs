import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminLocations } from "@/hooks/data/useAdminLocations";
import { columns } from "@/components/admin/locations/Columns";
import { LocationsDataTable } from "@/components/admin/locations/LocationsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";

const AdminLocationsPage = () => {
    const { data: locations, isLoading, error } = useAdminLocations();

    if (error) {
        return <div>Lỗi: {error.message}</div>
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Quản lý Địa điểm</CardTitle>
                        <CardDescription>Xem, tạo, sửa và xóa các địa điểm trên trang web.</CardDescription>
                    </div>
                    <Button>
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
                    <LocationsDataTable columns={columns} data={locations || []} />
                )}
            </CardContent>
        </Card>
    );
};

export default AdminLocationsPage;