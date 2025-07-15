import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useAddLocationToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, locationId }: { collectionId: number; locationId: string }) => {
      const { data, error } = await supabase
        .from('collection_locations')
        .insert({ collection_id: collectionId, location_id: locationId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      showSuccess('Đã thêm địa điểm vào bộ sưu tập!');
      queryClient.invalidateQueries({ queryKey: ['admin-collection-detail', variables.collectionId] });
    },
    onError: (error: any) => {
      console.error('Error adding location to collection:', error);
      if (error.message.includes('duplicate key value')) {
        showError('Địa điểm này đã có trong bộ sưu tập.');
      } else {
        showError('Không thể thêm địa điểm. Vui lòng thử lại.');
      }
    },
  });
};