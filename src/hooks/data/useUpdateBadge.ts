import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/types/database';

type UpdateBadgeData = { id: number } & Partial<Omit<Badge, 'id' | 'created_at'>>;

export const useUpdateBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateBadgeData) => {
      const { data, error } = await supabase
        .from('badges')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật huy hiệu thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
    },
    onError: () => {
      showError('Không thể cập nhật huy hiệu. Vui lòng thử lại.');
    },
  });
};