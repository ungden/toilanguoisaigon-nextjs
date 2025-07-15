import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: any) => {
      const { data, error } = await supabase
        .from('locations')
        .insert([locationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo địa điểm mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    },
    onError: (error) => {
      console.error('Error creating location:', error);
      showError('Không thể tạo địa điểm. Vui lòng thử lại.');
    },
  });
};