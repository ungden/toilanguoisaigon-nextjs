import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SavedLocationStat {
  location_id: string;
  name: string;
  slug: string;
  district: string;
  average_rating: number;
  save_count: number;
}

const fetchAdminSavedLocations = async (): Promise<SavedLocationStat[]> => {
  const { data, error } = await supabase
    .from('saved_locations')
    .select('location_id, locations(name, slug, district, average_rating)');

  if (error) throw new Error(error.message);

  // Group by location_id and count saves
  const countMap: Record<string, SavedLocationStat> = {};
  const savedData = (data || []) as unknown as { location_id: string; locations: { name: string; slug: string; district: string; average_rating: number } | null }[];
  savedData.forEach((row) => {
    const locId = row.location_id;
    const loc = row.locations;
    if (!loc) return;

    if (!countMap[locId]) {
      countMap[locId] = {
        location_id: locId,
        name: loc.name || 'Không rõ',
        slug: loc.slug || '',
        district: loc.district || 'Không rõ',
        average_rating: loc.average_rating || 0,
        save_count: 0,
      };
    }
    countMap[locId].save_count++;
  });

  return Object.values(countMap).sort((a, b) => b.save_count - a.save_count);
};

export const useAdminSavedLocations = () => {
  return useQuery<SavedLocationStat[], Error>({
    queryKey: ['admin-saved-locations'],
    queryFn: fetchAdminSavedLocations,
    staleTime: 1000 * 60 * 5,
  });
};
