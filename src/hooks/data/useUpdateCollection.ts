import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: number, [key: string]: any }) => {
      const { data, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật bộ sưu tập thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    },
    onError: (error) => {
      console.error('Error updating collection:', error);
      showError('Không thể cập nhật bộ sưu tập. Vui lòng thử lại.');
    },
  });
};