import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface UpdateReviewArgs {
  reviewId: string;
  rating: number;
  comment: string | null;
}

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, rating, comment }: UpdateReviewArgs) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating, comment, updated_at: new Date().toISOString() })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['location-detail'] });
    },
    onError: (error) => {
      console.error('Error updating review:', error);
      showError('Không thể cập nhật đánh giá. Vui lòng thử lại.');
    },
  });
};