import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

const searchLocations = async (query: string): Promise<Pick<Location, 'id' | 'name' | 'district'>[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, district')
    .ilike('name', `%${query.trim()}%`)
    .limit(10);

  if (error) {
    console.error('Error searching locations:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminSearchLocations = (query: string) => {
  return useQuery<Pick<Location, 'id' | 'name' | 'district'>[], Error>({
    queryKey: ['admin-search-locations', query],
    queryFn: () => searchLocations(query),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
};