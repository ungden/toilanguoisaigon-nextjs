import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: number) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Thẻ tag đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
    },
    onError: () => {
      showError('Không thể xóa thẻ tag. Vui lòng thử lại.');
    },
  });
};
