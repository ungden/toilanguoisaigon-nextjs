import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export const useLikeReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, userId }: { reviewId: string; userId: string }) => {
      const { error } = await supabase
        .from('review_likes')
        .insert({ review_id: reviewId, user_id: userId });

      if (error) {
        if (error.code === '23505') return; // already liked, ignore
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['location-detail'] });
    },
    onError: () => {
      showError('Không thể thích đánh giá. Vui lòng thử lại.');
    },
  });
};

export const useUnlikeReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, userId }: { reviewId: string; userId: string }) => {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['location-detail'] });
    },
    onError: () => {
      showError('Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};
