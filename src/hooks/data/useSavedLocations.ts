import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

interface SavedLocationWithDetails {
  location_id: string;
  user_id: string;
  created_at: string;
  locations: Location | null; // Details of the saved location
}

const fetchSavedLocations = async (userId: string): Promise<Location[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('saved_locations')
    .select(`
      location_id,
      user_id,
      created_at,
      locations (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved locations:', error);
    throw new Error(error.message);
  }

  // Explicitly cast the data to the expected array type
  const typedData: SavedLocationWithDetails[] = data || [];

  return typedData
    .map((item) => item.locations)
    .filter(Boolean) as Location[];
};

export const useSavedLocations = (userId: string | undefined) => {
  return useQuery<Location[], Error>({
    queryKey: ['savedLocations', userId],
    queryFn: () => fetchSavedLocations(userId!),
    enabled: !!userId, // Only run query if userId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};