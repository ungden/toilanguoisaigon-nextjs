import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

export interface UseLocationsOptions {
  limit?: number;
  offset?: number;
  query?: string;
  priceRanges?: string[];
  districts?: string[];
  categories?: string[];
}

const fetchLocations = async (options: UseLocationsOptions = {}): Promise<Location[]> => {
  const { limit = 10, offset = 0, query, priceRanges, districts, categories } = options;

  let queryBuilder = supabase
    .from('locations')
    .select('*, location_categories!inner(categories!inner(name))', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (query && query.trim() !== '') {
    const q = query.trim();
    queryBuilder = queryBuilder.or(`name.ilike.%${q}%,address.ilike.%${q}%,district.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (priceRanges && priceRanges.length > 0) {
    queryBuilder = queryBuilder.in('price_range', priceRanges);
  }

  if (districts && districts.length > 0) {
    queryBuilder = queryBuilder.in('district', districts);
  }

  if (categories && categories.length > 0) {
    queryBuilder = queryBuilder.in('location_categories.categories.name', categories);
  }

  // If no categories filter, use simple query without join
  if (!categories || categories.length === 0) {
    const simpleQuery = supabase
      .from('locations')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    let sq = simpleQuery;
    if (query && query.trim() !== '') {
      const q = query.trim();
      sq = sq.or(`name.ilike.%${q}%,address.ilike.%${q}%,district.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (priceRanges && priceRanges.length > 0) {
      sq = sq.in('price_range', priceRanges);
    }
    if (districts && districts.length > 0) {
      sq = sq.in('district', districts);
    }
    sq = sq.range(offset, offset + limit - 1);

    const { data, error } = await sq;
    if (error) throw new Error(error.message);
    return data || [];
  }

  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useLocations = (options: UseLocationsOptions = {}) => {
  return useQuery<Location[], Error>({
    queryKey: ['locations', options],
    queryFn: () => fetchLocations(options),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });
};
