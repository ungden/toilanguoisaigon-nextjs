import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useSaveLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, locationId }: { userId: string; locationId: string }) => {
      const { data, error } = await supabase
        .from('saved_locations')
        .insert({ user_id: userId, location_id: locationId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Đã lưu địa điểm vào sổ tay!');
      queryClient.invalidateQueries({ queryKey: ['savedLocations'] });
      queryClient.invalidateQueries({ queryKey: ['location-detail'] }); // Invalidate detail page to update save status
    },
    onError: (error) => {
      console.error('Error saving location:', error);
      showError('Không thể lưu địa điểm. Vui lòng thử lại.');
    },
  });
};