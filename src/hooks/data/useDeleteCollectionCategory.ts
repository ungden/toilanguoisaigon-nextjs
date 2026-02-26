import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteCollectionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      const { error } = await supabase
        .from('collection_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Danh mục bộ sưu tập đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collection-categories'] });
    },
    onError: () => {
      showError('Không thể xóa danh mục. Vui lòng thử lại.');
    },
  });
};
