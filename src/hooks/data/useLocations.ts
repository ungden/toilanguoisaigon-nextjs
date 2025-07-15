import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

interface UseLocationsOptions {
  limit?: number;
  query?: string;
  priceRanges?: string[];
}

const fetchLocations = async (options: UseLocationsOptions = {}): Promise<Location[]> => {
  const { limit = 10, query, priceRanges } = options;
  
  console.log('Fetching locations with options:', options);

  let queryBuilder = supabase
    .from('locations')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (query && query.trim() !== '') {
    queryBuilder = queryBuilder.ilike('name', `%${query.trim()}%`);
  }

  if (priceRanges && priceRanges.length > 0) {
    queryBuilder = queryBuilder.in('price_range', priceRanges);
  }

  queryBuilder = queryBuilder.limit(limit);

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error(error.message);
  }

  console.log('Fetched locations:', data);
  return data || [];
};

export const useLocations = (options: UseLocationsOptions = {}) => {
  return useQuery<Location[], Error>({
    queryKey: ['locations', options],
    queryFn: () => fetchLocations(options),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};