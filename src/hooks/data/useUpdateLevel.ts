import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export const useUpdateLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ level, ...updateData }: { level: number, [key: string]: any }) => {
      const { data, error } = await supabase
        .from('levels')
        .update(updateData)
        .eq('level', level)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật cấp độ thành công!');
      queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
    onError: (error) => {
      console.error('Error updating level:', error);
      showError('Không thể cập nhật cấp độ. Vui lòng thử lại.');
    },
  });
};