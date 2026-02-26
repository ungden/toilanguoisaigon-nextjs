import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Post } from '@/types/database';

export type CreatePostData = Omit<Post, 'id' | 'created_at' | 'updated_at' | 'profiles'>;

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: CreatePostData) => {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo bài viết mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: () => {
      showError('Không thể tạo bài viết. Vui lòng thử lại.');
    },
  });
};