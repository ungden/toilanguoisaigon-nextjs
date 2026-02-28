import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NearbyLocation {
  id: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  main_image_url: string | null;
  price_range: string | null;
  average_rating: number;
  review_count: number;
  category: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
}

interface UseNearbyLocationsOptions {
  latitude: number | null;
  longitude: number | null;
  radiusKm?: number;
  enabled?: boolean;
}

export const useNearbyLocations = ({
  latitude,
  longitude,
  radiusKm = 5,
  enabled = true,
}: UseNearbyLocationsOptions) => {
  return useQuery({
    queryKey: ['locations', 'nearby', latitude, longitude, radiusKm],
    queryFn: async (): Promise<NearbyLocation[]> => {
      if (!latitude || !longitude) return [];

      const { data, error } = await supabase.rpc('get_nearby_locations', {
        user_lat: latitude,
        user_lon: longitude,
        max_distance_km: radiusKm,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as NearbyLocation[];
    },
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
