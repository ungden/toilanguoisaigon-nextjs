import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string, [key: string]: any }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật địa điểm thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    },
    onError: (error) => {
      console.error('Error updating location:', error);
      showError('Không thể cập nhật địa điểm. Vui lòng thử lại.');
    },
  });
};