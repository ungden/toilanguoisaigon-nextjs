import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Danh mục đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: () => {
      showError('Không thể xóa danh mục. Vui lòng thử lại.');
    },
  });
};
