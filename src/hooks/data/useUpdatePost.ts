import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string, [key: string]: any }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật bài viết thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: (error) => {
      console.error('Error updating post:', error);
      showError('Không thể cập nhật bài viết. Vui lòng thử lại.');
    },
  });
};