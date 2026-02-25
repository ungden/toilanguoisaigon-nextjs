import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Level } from '@/types/database';

export const useCreateLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (levelData: Level) => {
      const { data, error } = await supabase
        .from('levels')
        .insert([levelData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo cấp độ mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
    onError: (error) => {
      console.error('Error creating level:', error);
      showError('Không thể tạo cấp độ. Vui lòng thử lại.');
    },
  });
};