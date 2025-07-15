import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Review } from '@/types/database';
import { useUpdateReview } from '@/hooks/data/useUpdateReview';
import { Star } from 'lucide-react';
import { useState } from 'react';

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, { message: 'Bình luận phải có ít nhất 10 ký tự.' }).optional().or(z.literal('')),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface EditReviewFormProps {
  review: Review;
  onSuccess: () => void;
}

export function EditReviewForm({ review, onSuccess }: EditReviewFormProps) {
  const updateReviewMutation = useUpdateReview();
  const [rating, setRating] = useState(review.rating);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: review.rating,
      comment: review.comment || '',
    },
  });

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    form.setValue('rating', newRating);
  };

  async function onSubmit(data: ReviewFormValues) {
    await updateReviewMutation.mutateAsync({
      reviewId: review.id,
      rating: data.rating,
      comment: data.comment || null,
    });
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={() => (
            <FormItem>
              <FormLabel>Đánh giá của bạn</FormLabel>
              <FormControl>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-7 w-7 cursor-pointer transition-colors ${
                        star <= rating
                          ? 'fill-vietnam-gold-500 text-vietnam-gold-500'
                          : 'fill-gray-200 text-gray-200 hover:fill-vietnam-gold-300'
                      }`}
                      onClick={() => handleRatingChange(star)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bình luận</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" className="btn-vietnam" disabled={updateReviewMutation.isPending}>
            {updateReviewMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Form>
  );
}