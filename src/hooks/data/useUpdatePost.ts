import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Post } from '@/types/database';

type UpdatePostData = { id: string } & Partial<Omit<Post, 'id' | 'created_at' | 'updated_at' | 'profiles'>>;

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePostData) => {
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