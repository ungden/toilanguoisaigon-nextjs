import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AwardXpResult } from '@/types/database';
import { showSuccess } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

interface AwardXpParams {
  userId: string;
  actionName: string;
  metadata?: Record<string, unknown>;
}

export const useAwardXp = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, actionName, metadata = {} }: AwardXpParams): Promise<AwardXpResult> => {
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_action_name: actionName,
        p_metadata: metadata,
      });

      if (error) throw error;
      return data as AwardXpResult;
    },
    onSuccess: (result) => {
      if (result.leveled_up) {
        showSuccess(`Chúc mừng! Bạn đã lên cấp ${result.new_level}! 🎉`);
      }
      // Refresh profile to update XP/level in header/sidebar
      refreshProfile();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['xp-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
  });
};
