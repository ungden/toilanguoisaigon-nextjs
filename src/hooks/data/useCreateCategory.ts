import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Category } from '@/types/database';

export type CreateCategoryData = Omit<Category, 'id' | 'created_at'>;

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo danh mục mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: () => {
      showError('Không thể tạo danh mục. Vui lòng thử lại.');
    },
  });
};
