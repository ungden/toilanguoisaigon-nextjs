import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Location } from '@/types/database';

type CreateLocationData = Omit<Location, 'id' | 'created_at' | 'average_rating' | 'review_count' | 'isSaved'>;

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: CreateLocationData) => {
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
    onError: () => {
      showError('Không thể tạo địa điểm. Vui lòng thử lại.');
    },
  });
};