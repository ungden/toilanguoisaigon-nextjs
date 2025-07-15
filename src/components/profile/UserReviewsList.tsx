import { useAuth } from "@/contexts/AuthContext";
import { useUserReviews } from "@/hooks/data/useUserReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { UserReviewCard } from "./UserReviewCard";
import { MessageSquare } from "lucide-react";

export function UserReviewsList() {
  const { user } = useAuth();
  const { data: reviews, isLoading, error } = useUserReviews(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Lỗi tải đánh giá: {error.message}</p>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Bạn chưa có đánh giá nào</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy khám phá và chia sẻ trải nghiệm của bạn với cộng đồng!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <UserReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}