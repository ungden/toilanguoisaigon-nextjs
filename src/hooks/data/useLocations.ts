import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

export interface UseLocationsOptions {
  limit?: number;
  query?: string;
  priceRanges?: string[];
  districts?: string[];
}

const fetchLocations = async (options: UseLocationsOptions = {}): Promise<Location[]> => {
  const { limit = 10, query, priceRanges, districts } = options;

  let queryBuilder = supabase
    .from('locations')
    .select('*')
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

  queryBuilder = queryBuilder.limit(limit);

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
