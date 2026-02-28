import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Collection } from '@/types/database';

type UpdateCollectionAIData = { id: number } & Partial<Omit<Collection, 'id' | 'created_at' | 'updated_at' | 'collection_categories'>>;

export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateCollectionAIData) => {
      const { data, error } = await supabase
        .from('collections')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Cập nhật bộ sưu tập AI thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: () => {
      showError('Không thể cập nhật bộ sưu tập AI. Vui lòng thử lại.');
    },
  });
};
