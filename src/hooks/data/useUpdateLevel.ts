import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Level } from '@/types/database';

type UpdateLevelData = { level: number } & Partial<Omit<Level, 'level'>>;

export const useUpdateLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ level, ...updateData }: UpdateLevelData) => {
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
    onError: () => {
      showError('Không thể cập nhật cấp độ. Vui lòng thử lại.');
    },
  });
};