import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Tag } from '@/types/database';

type UpdateTagData = { id: number } & Partial<Omit<Tag, 'id' | 'created_at'>>;

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTagData) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật thẻ tag thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      showError('Không thể cập nhật thẻ tag. Vui lòng thử lại.');
    },
  });
};
