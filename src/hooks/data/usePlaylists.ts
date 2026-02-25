import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Playlist } from '@/types/database';

/**
 * Fetch published playlists, newest first.
 * Used on homepage and /playlists listing page.
 */
export const usePlaylists = (options?: { limit?: number; featured?: boolean }) => {
  const limit = options?.limit ?? 20;
  const featured = options?.featured ?? false;

  return useQuery({
    queryKey: ['playlists', { limit, featured }],
    queryFn: async () => {
      let query = supabase
        .from('playlists')
        .select('*')
        .eq('status', 'published')
        .order('generated_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Playlist[];
    },
    retry: 1,
  });
};

/**
 * Fetch today's playlists specifically.
 */
export const useTodayPlaylists = () => {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['playlists', 'today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('status', 'published')
        .eq('generated_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
  });
};
