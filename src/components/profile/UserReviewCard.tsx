import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Star, Pencil, Trash2 } from "lucide-react";
import { ReviewWithProfileAndLocation } from "@/types/database";
import { Link } from "react-router-dom";
import { useDeleteReview } from "@/hooks/data/useDeleteReview";
import { EditReviewForm } from './EditReviewForm';

interface UserReviewCardProps {
  review: ReviewWithProfileAndLocation;
}

export function UserReviewCard({ review }: UserReviewCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const deleteReviewMutation = useDeleteReview();

  const handleDelete = () => {
    deleteReviewMutation.mutate(review.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link to={`/place/${review.locations?.slug}`} className="hover:underline text-vietnam-blue-800">
                {review.locations?.name || 'Địa điểm không xác định'}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-vietnam-gold-500 text-vietnam-gold-500' : 'fill-gray-200 text-gray-200'}`} />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground italic">"{review.comment || 'Không có bình luận.'}"</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
            </DialogHeader>
            <EditReviewForm review={review} onSuccess={() => setIsEditDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Đánh giá của bạn sẽ bị xóa vĩnh viễn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteReviewMutation.isPending}>
                {deleteReviewMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}