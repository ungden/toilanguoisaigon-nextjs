import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Tag } from '@/types/database';

export type CreateTagData = Omit<Tag, 'id' | 'created_at'>;

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData) => {
      const { data, error } = await supabase
        .from('tags')
        .insert([tagData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo thẻ tag mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      showError('Không thể tạo thẻ tag. Vui lòng thử lại.');
    },
  });
};
