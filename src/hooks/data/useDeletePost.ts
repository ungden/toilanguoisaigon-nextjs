import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Bài viết đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: () => {
      showError('Không thể xóa bài viết. Vui lòng thử lại.');
    },
  });
};