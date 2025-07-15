import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Đánh giá đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (error) => {
      console.error('Error deleting review:', error);
      showError('Không thể xóa đánh giá. Vui lòng thử lại.');
    },
  });
};