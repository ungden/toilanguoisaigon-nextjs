import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useUnsaveLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, locationId }: { userId: string; locationId: string }) => {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('user_id', userId)
        .eq('location_id', locationId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Đã xóa địa điểm khỏi sổ tay!');
      queryClient.invalidateQueries({ queryKey: ['savedLocations'] });
      queryClient.invalidateQueries({ queryKey: ['location-detail'] }); // Invalidate detail page to update save status
    },
    onError: (error) => {
      console.error('Error unsaving location:', error);
      showError('Không thể xóa địa điểm khỏi sổ tay. Vui lòng thử lại.');
    },
  });
};