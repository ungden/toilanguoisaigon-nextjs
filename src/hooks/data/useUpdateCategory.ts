import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Category } from '@/types/database';

type UpdateCategoryData = { id: number } & Partial<Omit<Category, 'id' | 'created_at'>>;

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateCategoryData) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: () => {
      showError('Không thể cập nhật danh mục. Vui lòng thử lại.');
    },
  });
};
