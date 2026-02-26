import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { CollectionCategory } from '@/types/database';

export type CreateCollectionCategoryData = Omit<CollectionCategory, 'id' | 'created_at'>;

export const useCreateCollectionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: CreateCollectionCategoryData) => {
      const { data, error } = await supabase
        .from('collection_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo danh mục bộ sưu tập mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collection-categories'] });
    },
    onError: () => {
      showError('Không thể tạo danh mục. Vui lòng thử lại.');
    },
  });
};
