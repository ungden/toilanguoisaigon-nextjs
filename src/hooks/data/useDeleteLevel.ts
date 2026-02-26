import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useDeleteLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (level: number) => {
      const { error } = await supabase
        .from('levels')
        .delete()
        .eq('level', level);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Cấp độ đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
    onError: () => {
      showError('Không thể xóa cấp độ. Vui lòng thử lại.');
    },
  });
};