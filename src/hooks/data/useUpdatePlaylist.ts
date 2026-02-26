import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Playlist } from '@/types/database';

type UpdatePlaylistData = { id: string } & Partial<Omit<Playlist, 'id' | 'created_at' | 'updated_at'>>;

export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePlaylistData) => {
      const { data, error } = await supabase
        .from('playlists')
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
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: () => {
      showError('Không thể cập nhật bộ sưu tập AI. Vui lòng thử lại.');
    },
  });
};
