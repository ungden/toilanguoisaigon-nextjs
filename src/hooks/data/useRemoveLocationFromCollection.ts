import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useRemoveLocationFromCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, locationId }: { collectionId: number; locationId: string }) => {
      const { error } = await supabase
        .from('collection_locations')
        .delete()
        .eq('collection_id', collectionId)
        .eq('location_id', locationId);

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      showSuccess('Đã xóa địa điểm khỏi bộ sưu tập!');
      queryClient.invalidateQueries({ queryKey: ['admin-collection-detail', variables.collectionId] });
    },
    onError: () => {
      showError('Không thể xóa địa điểm. Vui lòng thử lại.');
    },
  });
};