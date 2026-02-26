"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { ReviewWithProfileAndLocation } from "@/types/database";
import { useUpdateReview } from "@/hooks/data/useUpdateReview";

interface ReviewEditDialogProps {
  review: ReviewWithProfileAndLocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewEditDialog({ review, isOpen, onClose }: ReviewEditDialogProps) {
  const [rating, setRating] = useState(1);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const updateReviewMutation = useUpdateReview();

  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment || "");
    }
  }, [review]);

  const handleSave = () => {
    if (!review) return;
    updateReviewMutation.mutate(
      { reviewId: review.id, rating, comment: comment || null },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
          <DialogDescription>
            Cập nhật đánh giá của{" "}
            {review?.profiles?.full_name || "người dùng ẩn danh"} cho{" "}
            {review?.locations?.name || "địa điểm"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Rating selector */}
          <div className="space-y-2">
            <Label>Đánh giá</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-0.5 focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  aria-label={`${star} sao`}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {hoveredStar || rating}/5
              </span>
            </div>
          </div>

          {/* Comment textarea */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Nội dung</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập nội dung đánh giá..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={updateReviewMutation.isPending}>
            {updateReviewMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
