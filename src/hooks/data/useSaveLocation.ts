import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useAwardXp } from '@/hooks/data/useAwardXp';
import { useBadgeEvaluator } from '@/hooks/data/useBadgeEvaluator';

export const useSaveLocation = () => {
  const queryClient = useQueryClient();
  const awardXp = useAwardXp();
  const evaluateBadges = useBadgeEvaluator();

  return useMutation({
    mutationFn: async ({ userId, locationId }: { userId: string; locationId: string }) => {
      const { data, error } = await supabase
        .from('saved_locations')
        .insert({ user_id: userId, location_id: locationId })
        .select()
        .single();

      if (error) throw error;
      return { data, userId };
    },
    onSuccess: ({ userId }) => {
      showSuccess('Đã lưu địa điểm vào sổ tay! +3 XP');
      queryClient.invalidateQueries({ queryKey: ['savedLocations'] });
      queryClient.invalidateQueries({ queryKey: ['location-detail'] });
      // Award XP for saving location
      awardXp.mutate(
        { userId, actionName: 'SAVE_LOCATION', metadata: {} },
        { onSuccess: () => evaluateBadges.mutate(userId) }
      );
    },
    onError: () => {
      showError('Không thể lưu địa điểm. Vui lòng thử lại.');
    },
  });
};