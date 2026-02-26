import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Fetch tag IDs for a given location */
export const useLocationTags = (locationId: string | undefined) => {
  return useQuery<number[], Error>({
    queryKey: ['location-tags', locationId],
    queryFn: async () => {
      if (!locationId) return [];
      const { data, error } = await supabase
        .from('location_tags')
        .select('tag_id')
        .eq('location_id', locationId);
      if (error) throw error;
      return (data || []).map(r => r.tag_id);
    },
    enabled: !!locationId,
  });
};
