import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Playlist, PlaylistStatus } from '@/types/database';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Fetch all playlists for admin (all statuses).
 */
export const useAdminPlaylists = () => {
  return useQuery({
    queryKey: ['admin-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('generated_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
  });
};

/**
 * Generate new playlists via Gemini AI.
 */
export const useGeneratePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { mood?: string; count?: number; auto_publish?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('generate-playlist', {
        body: params || {},
      });

      if (error) throw new Error(`Lỗi gọi Edge Function: ${error.message}`);
      if (data.error) throw new Error(data.error);

      return data as {
        success: boolean;
        playlists: Array<{
          id: string;
          title: string;
          slug: string;
          mood: string;
          emoji: string;
          location_count: number;
          new_locations_created: number;
        }>;
        total: number;
        date: string;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showSuccess(`Đã tạo ${data.total} playlist mới!`);
    },
    onError: (error: Error) => {
      console.error('Generate playlist error:', error);
      showError(error.message || 'Không thể tạo playlist. Vui lòng thử lại.');
    },
  });
};

/**
 * Update playlist status (publish/archive/draft).
 */
export const useUpdatePlaylistStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlaylistStatus }) => {
      const { error } = await supabase
        .from('playlists')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showSuccess('Đã cập nhật trạng thái playlist.');
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
};

/**
 * Toggle playlist featured status.
 */
export const useTogglePlaylistFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('playlists')
        .update({ is_featured })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showSuccess('Đã cập nhật playlist nổi bật.');
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
};

/**
 * Delete a playlist.
 */
export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showSuccess('Đã xóa playlist.');
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
};
