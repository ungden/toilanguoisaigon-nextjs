import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/types/database';

export type CreateBadgeData = Omit<Badge, 'id' | 'created_at'>;

export const useCreateBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeData: CreateBadgeData) => {
      const { data, error } = await supabase
        .from('badges')
        .insert([badgeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo huy hiệu mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
    },
    onError: () => {
      showError('Không thể tạo huy hiệu. Vui lòng thử lại.');
    },
  });
};