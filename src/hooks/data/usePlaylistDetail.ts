import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlaylistWithLocations } from '@/types/database';

/**
 * Fetch a single playlist with its locations (ordered by position).
 */
export const usePlaylistDetail = (slug: string) => {
  return useQuery({
    queryKey: ['playlist', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_locations (
            playlist_id,
            location_id,
            position,
            ai_note,
            locations (
              id,
              name,
              slug,
              address,
              district,
              main_image_url,
              average_rating,
              review_count,
              price_range
            )
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      // Sort playlist_locations by position
      if (data?.playlist_locations) {
        data.playlist_locations.sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
        );
      }

      return data as PlaylistWithLocations;
    },
    enabled: !!slug,
  });
};
