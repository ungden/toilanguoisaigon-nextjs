import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

// Supabase PostgREST trả về object (không phải array) cho quan hệ many-to-one
// saved_locations.location_id → locations.id là many-to-one
type SavedLocationQueryResult = {
  location_id: string;
  user_id: string;
  created_at: string;
  locations: Location | null;
};

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
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  const typedData = data as unknown as SavedLocationQueryResult[] | null;

  return (typedData || [])
    .map((item) => item.locations)
    .filter(Boolean) as Location[];
};

export const useSavedLocations = (userId: string | undefined) => {
  return useQuery<Location[], Error>({
    queryKey: ['savedLocations', userId],
    queryFn: () => fetchSavedLocations(userId!),
    enabled: !!userId, // Chỉ chạy truy vấn nếu userId có sẵn
    staleTime: 1000 * 60 * 5, // 5 phút
  });
};