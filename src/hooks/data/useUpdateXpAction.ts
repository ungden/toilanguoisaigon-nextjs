import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useUpdateXpAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action_name, ...updateData }: { action_name: string, [key: string]: any }) => {
      const { data, error } = await supabase
        .from('xp_actions')
        .update(updateData)
        .eq('action_name', action_name)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật hành động thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-xp-actions'] });
    },
    onError: (error) => {
      console.error('Error updating xp action:', error);
      showError('Không thể cập nhật hành động. Vui lòng thử lại.');
    },
  });
};