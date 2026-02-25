import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteStats {
  locationCount: number;
  reviewCount: number;
  collectionCount: number;
}

const fetchStats = async (): Promise<SiteStats> => {
  const [locationsResult, reviewsResult, collectionsResult] = await Promise.all([
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('collections').select('id', { count: 'exact', head: true }),
  ]);

  return {
    locationCount: locationsResult.count || 0,
    reviewCount: reviewsResult.count || 0,
    collectionCount: collectionsResult.count || 0,
  };
};

export const useStats = () => {
  return useQuery<SiteStats, Error>({
    queryKey: ['site-stats'],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
