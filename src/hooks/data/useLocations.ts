import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Location } from '../../types/database';

interface UseLocationsOptions {
  limit?: number;
  query?: string;
}

const fetchLocations = async (options: UseLocationsOptions = {}): Promise<Location[]> => {
  const { limit = 10, query } = options;

  let queryBuilder = supabase
    .from('locations')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query && query.trim() !== '') {
    queryBuilder = queryBuilder.textSearch('name', `'${query.trim()}'`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useLocations = (options: UseLocationsOptions = {}) => {
  return useQuery<Location[], Error>({
    queryKey: ['locations', options],
    queryFn: () => fetchLocations(options),
    enabled: true, 
  });
};