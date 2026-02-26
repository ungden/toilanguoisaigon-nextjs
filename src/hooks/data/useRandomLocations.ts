import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

const fetchRandomLocations = async (count: number): Promise<Location[]> => {
  const { data, error } = await supabase.rpc('get_random_locations', {
    limit_count: count,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useRandomLocations = (count: number) => {
  return useQuery<Location[], Error>({
    queryKey: ['random-locations', count],
    queryFn: () => fetchRandomLocations(count),
    staleTime: 0, // Luôn lấy dữ liệu mới
    refetchOnWindowFocus: false, // Không fetch lại khi focus vào cửa sổ
    refetchOnMount: true,
  });
};