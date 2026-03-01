import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

const fetchTrendingLocations = async (count: number): Promise<Location[]> => {
  const { data, error } = await supabase.rpc('get_trending_locations', {
    limit_count: count,
  });

  if (error) {
    // Fallback: locations with most saves + recent reviews
    const { data: fallback, error: fbError } = await supabase
      .from('locations')
      .select('*')
      .eq('status', 'published')
      .order('save_count', { ascending: false })
      .order('latest_review_at', { ascending: false, nullsFirst: false })
      .limit(count);

    if (fbError) throw new Error(fbError.message);
    return fallback || [];
  }

  if (!data || data.length === 0) return [];

  // Enrich with category names
  const locationIds = data.map((loc: Location) => loc.id);
  const { data: categories } = await supabase
    .from('location_categories')
    .select('location_id, categories(name)')
    .in('location_id', locationIds);

  const categoryMap = new Map<string, string>();
  if (categories) {
    for (const row of categories) {
      if (!categoryMap.has(row.location_id)) {
        const cat = row.categories as unknown as { name: string } | null;
        if (cat?.name) categoryMap.set(row.location_id, cat.name);
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

export const useTrendingLocations = (count: number = 8) => {
  return useQuery<Location[], Error>({
    queryKey: ['trending-locations', count],
    queryFn: () => fetchTrendingLocations(count),
    staleTime: 1000 * 60 * 3,
  });
};
