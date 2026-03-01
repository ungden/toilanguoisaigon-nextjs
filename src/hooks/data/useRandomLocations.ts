import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

const fetchRandomLocations = async (count: number): Promise<Location[]> => {
  const { data, error } = await supabase.rpc('get_random_locations', {
    limit_count: count,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) return [];

  // Enrich with category names (relational data not returned by RPC)
  const locationIds = data.map((loc: Location) => loc.id);
  const { data: categories } = await supabase
    .from('location_categories')
    .select('location_id, categories(name)')
    .in('location_id', locationIds);

  const categoryMap = new Map<string, string>();
  if (categories) {
    for (const row of categories) {
      // Only keep the first category per location
      if (!categoryMap.has(row.location_id)) {
        const cat = row.categories as unknown as { name: string } | null;
        if (cat?.name) {
          categoryMap.set(row.location_id, cat.name);
        }
      }
    }
  }

  return data.map((loc: Location) => ({
    ...loc,
    location_categories: categoryMap.has(loc.id)
      ? [{ categories: { name: categoryMap.get(loc.id)! } }]
      : undefined,
  }));
};

export const useRandomLocations = (count: number) => {
  return useQuery<Location[], Error>({
    queryKey: ['random-locations', count],
    queryFn: () => fetchRandomLocations(count),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};
