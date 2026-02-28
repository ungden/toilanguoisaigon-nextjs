import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollectionWithLocations } from '@/types/database';

/**
 * Fetch a single AI collection with its locations (ordered by position).
 */
export const usePlaylistDetail = (slug: string) => {
  return useQuery({
    queryKey: ['collection-detail', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_locations (
            collection_id,
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

      // Sort collection_locations by position
      if (data?.collection_locations) {
        data.collection_locations.sort(
          (a: { position: number | null }, b: { position: number | null }) =>
            (a.position ?? 0) - (b.position ?? 0)
        );
      }

      return data as CollectionWithLocations;
    },
    enabled: !!slug,
  });
};
