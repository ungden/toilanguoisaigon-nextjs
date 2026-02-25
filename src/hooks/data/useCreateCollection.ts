import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Collection } from '@/types/database';

type CreateCollectionData = Omit<Collection, 'id' | 'created_at' | 'collection_categories'>;

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionData: CreateCollectionData) => {
      const { data, error } = await supabase
        .from('collections')
        .insert([collectionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Tạo bộ sưu tập mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    },
    onError: (error) => {
      console.error('Error creating collection:', error);
      showError('Không thể tạo bộ sưu tập. Vui lòng thử lại.');
    },
  });
};