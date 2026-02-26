import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAwardXp } from '@/hooks/data/useAwardXp';
import { useBadgeEvaluator } from '@/hooks/data/useBadgeEvaluator';

interface SubmissionData {
  name: string;
  address: string;
  district: string;
  description?: string;
  notes?: string;
}

export const useSubmitLocation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const awardXp = useAwardXp();
  const evaluateBadges = useBadgeEvaluator();

  return useMutation({
    mutationFn: async (submissionData: SubmissionData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('location_submissions')
        .insert([{ ...submissionData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Gửi địa điểm thành công! +10 XP — Chúng tôi sẽ xem xét sớm nhất có thể.');
      queryClient.invalidateQueries({ queryKey: ['user-submissions'] });
      // Award XP for submitting location
      if (user) {
        awardXp.mutate(
          { userId: user.id, actionName: 'SUBMIT_LOCATION', metadata: {} },
          { onSuccess: () => evaluateBadges.mutate(user.id) }
        );
      }
    },
    onError: () => {
      showError('Không thể gửi địa điểm. Vui lòng thử lại.');
    },
  });
};