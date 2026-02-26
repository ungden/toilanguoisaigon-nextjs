import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { CollectionCategory } from '@/types/database';

type UpdateCollectionCategoryData = { id: number } & Partial<Omit<CollectionCategory, 'id' | 'created_at'>>;

export const useUpdateCollectionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateCollectionCategoryData) => {
      const { data, error } = await supabase
        .from('collection_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật danh mục bộ sưu tập thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collection-categories'] });
    },
    onError: () => {
      showError('Không thể cập nhật danh mục. Vui lòng thử lại.');
    },
  });
};
