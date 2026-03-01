import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

const fetchFeaturedLocations = async (count: number): Promise<Location[]> => {
  const { data, error } = await supabase.rpc('get_featured_locations', {
    limit_count: count,
  });

  if (error) {
    // Fallback: if RPC doesn't exist yet, use simple query
    const { data: fallback, error: fbError } = await supabase
      .from('locations')
      .select('*')
      .eq('status', 'published')
      .order('is_featured', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false })
      .order('average_rating', { ascending: false })
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

export const useFeaturedLocations = (count: number = 8) => {
  return useQuery<Location[], Error>({
    queryKey: ['featured-locations', count],
    queryFn: () => fetchFeaturedLocations(count),
    staleTime: 1000 * 60 * 5,
  });
};
