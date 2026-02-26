"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSavedLocations } from "@/hooks/data/useAdminSavedLocations";
import { Heart } from "lucide-react";

const AdminSavedLocationsPage = () => {
  const { data: locations, isLoading, error } = useAdminSavedLocations();

  if (error) {
    return <div className="text-destructive">Lỗi: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-vietnam-red-600" />
          <div>
            <CardTitle>Địa điểm Được lưu</CardTitle>
            <CardDescription>Xem những địa điểm được yêu thích nhất.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !locations || locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Chưa có địa điểm nào được lưu.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tên địa điểm</TableHead>
                <TableHead>Quận</TableHead>
                <TableHead className="text-right">Đánh giá TB</TableHead>
                <TableHead className="text-right">Lượt lưu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc, idx) => (
                <TableRow key={loc.location_id}>
                  <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <Link
                      href={`/place/${loc.slug}`}
                      className="text-sm font-medium text-vietnam-blue-600 hover:underline"
                    >
                      {loc.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{loc.district}</TableCell>
                  <TableCell className="text-right text-sm">
                    {loc.average_rating > 0 ? loc.average_rating.toFixed(1) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-vietnam-red-600">
                    {loc.save_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSavedLocationsPage;
