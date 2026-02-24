"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminReviews } from "@/hooks/data/useAdminReviews";
import { columns } from "@/components/admin/reviews/Columns";
import { ReviewsDataTable } from "@/components/admin/reviews/ReviewsDataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewWithProfileAndLocation } from "@/types/database";
import { useDeleteReview } from "@/hooks/data/useDeleteReview";
import { DeleteReviewDialog } from "@/components/admin/reviews/DeleteReviewDialog";

const AdminReviewsPage = () => {
    const [deletingReview, setDeletingReview] = useState<ReviewWithProfileAndLocation | null>(null);

    const { data: reviews, isLoading, error } = useAdminReviews();
    const deleteReviewMutation = useDeleteReview();

    const handleOpenDeleteDialog = (review: ReviewWithProfileAndLocation) => {
        setDeletingReview(review);
    };

    const handleCloseDeleteDialog = () => {
        setDeletingReview(null);
    };

    const handleConfirmDelete = () => {
        if (deletingReview) {
            deleteReviewMutation.mutate(deletingReview.id, {
                onSuccess: handleCloseDeleteDialog,
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
                    <CardTitle>Quản lý Đánh giá</CardTitle>
                    <CardDescription>Xem và xóa các đánh giá của người dùng trên trang web.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <ReviewsDataTable 
                            columns={columns({ onDelete: handleOpenDeleteDialog })} 
                            data={reviews || []} 
                        />
                    )}
                </CardContent>
            </Card>

            {deletingReview && (
                <DeleteReviewDialog
                    isOpen={!!deletingReview}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    isPending={deleteReviewMutation.isPending}
                />
            )}
        </>
    );
};

export default AdminReviewsPage;
