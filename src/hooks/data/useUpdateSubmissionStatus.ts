import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { SubmissionStatus } from '@/types/database';

interface UpdateStatusArgs {
  submissionId: string;
  status: SubmissionStatus;
}

export const useUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, status }: UpdateStatusArgs) => {
      const { data, error } = await supabase
        .from('location_submissions')
        .update({ status })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật trạng thái đóng góp thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
    },
    onError: (error) => {
      console.error('Error updating submission status:', error);
      showError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    },
  });
};