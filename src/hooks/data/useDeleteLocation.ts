import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Địa điểm đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    },
    onError: () => {
      showError('Không thể xóa địa điểm. Vui lòng thử lại.');
    },
  });
};