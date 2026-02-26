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
import { ReviewEditDialog } from "@/components/admin/reviews/ReviewEditDialog";
import { ReviewImageDialog } from "@/components/admin/reviews/ReviewImageDialog";

const AdminReviewsPage = () => {
    const [deletingReview, setDeletingReview] = useState<ReviewWithProfileAndLocation | null>(null);
    const [editingReview, setEditingReview] = useState<ReviewWithProfileAndLocation | null>(null);
    const [viewingImagesReview, setViewingImagesReview] = useState<ReviewWithProfileAndLocation | null>(null);

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

    const handleOpenEditDialog = (review: ReviewWithProfileAndLocation) => {
        setEditingReview(review);
    };

    const handleCloseEditDialog = () => {
        setEditingReview(null);
    };

    const handleViewImages = (review: ReviewWithProfileAndLocation) => {
        setViewingImagesReview(review);
    };

    const handleCloseImageDialog = () => {
        setViewingImagesReview(null);
    };

    if (error) {
        return <div>Lỗi: {error.message}</div>
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý Đánh giá</CardTitle>
                    <CardDescription>Xem, chỉnh sửa và xóa các đánh giá của người dùng trên trang web.</CardDescription>
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
                            columns={columns({ 
                                onDelete: handleOpenDeleteDialog,
                                onEdit: handleOpenEditDialog,
                                onViewImages: handleViewImages,
                            })} 
                            data={reviews || []} 
                        />
                    )}
                </CardContent>
            </Card>

            {/* Edit Review Dialog */}
            <ReviewEditDialog
                review={editingReview}
                isOpen={!!editingReview}
                onClose={handleCloseEditDialog}
            />

            {/* View Images Dialog */}
            <ReviewImageDialog
                images={viewingImagesReview?.image_urls || []}
                isOpen={!!viewingImagesReview}
                onClose={handleCloseImageDialog}
            />

            {/* Delete Review Dialog */}
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
