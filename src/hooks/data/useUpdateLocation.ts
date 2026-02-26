import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Location } from '@/types/database';

type UpdateLocationData = { id: string } & Partial<Omit<Location, 'id' | 'created_at' | 'average_rating' | 'review_count' | 'isSaved'>>;

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateLocationData) => {
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
    onError: () => {
      showError('Không thể cập nhật địa điểm. Vui lòng thử lại.');
    },
  });
};