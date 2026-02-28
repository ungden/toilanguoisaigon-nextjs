import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection, CollectionStatus } from '@/types/database';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Fetch all AI-generated collections for admin (all statuses).
 */
export const useAdminPlaylists = () => {
  return useQuery({
    queryKey: ['admin-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('source', 'ai')
        .order('generated_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Collection[];
    },
  });
};

/**
 * Generate new AI collections via Gemini AI.
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
        collections: Array<{
          id: number;
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
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      showSuccess(`Đã tạo ${data.total} bộ sưu tập AI mới!`);
    },
    onError: (error: Error) => {
      showError(error.message || 'Không thể tạo bộ sưu tập. Vui lòng thử lại.');
    },
  });
};

/**
 * Update collection status (publish/archive/draft).
 */
export const useUpdatePlaylistStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: CollectionStatus }) => {
      const { error } = await supabase
        .from('collections')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      showSuccess('Đã cập nhật trạng thái bộ sưu tập.');
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
};

/**
 * Toggle collection featured status.
 */
export const useTogglePlaylistFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: number; is_featured: boolean }) => {
      const { error } = await supabase
        .from('collections')
        .update({ is_featured })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      showSuccess('Đã cập nhật bộ sưu tập nổi bật.');
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
};

/**
 * Delete an AI collection.
 */
export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // Delete junction rows first
      const { error: junctionError } = await supabase
        .from('collection_locations')
        .delete()
        .eq('collection_id', id);
      if (junctionError) throw junctionError;

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      showSuccess('Đã xóa bộ sưu tập AI.');
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
};
