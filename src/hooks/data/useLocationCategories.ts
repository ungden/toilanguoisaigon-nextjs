import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Fetch category IDs for a given location */
export const useLocationCategories = (locationId: string | undefined) => {
  return useQuery<number[], Error>({
    queryKey: ['location-categories', locationId],
    queryFn: async () => {
      if (!locationId) return [];
      const { data, error } = await supabase
        .from('location_categories')
        .select('category_id')
        .eq('location_id', locationId);
      if (error) throw error;
      return (data || []).map(r => r.category_id);
    },
    enabled: !!locationId,
  });
};
