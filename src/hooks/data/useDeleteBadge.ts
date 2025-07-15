import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: number) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Huy hiệu đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
    },
    onError: (error) => {
      console.error('Error deleting badge:', error);
      showError('Không thể xóa huy hiệu. Vui lòng thử lại.');
    },
  });
};