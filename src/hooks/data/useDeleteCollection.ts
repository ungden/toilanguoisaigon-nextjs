import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: number) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Bộ sưu tập đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    },
    onError: (error) => {
      console.error('Error deleting collection:', error);
      showError('Không thể xóa bộ sưu tập. Vui lòng thử lại.');
    },
  });
};