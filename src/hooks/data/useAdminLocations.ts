import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

const fetchAdminLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminLocations = () => {
  return useQuery<Location[], Error>({
    queryKey: ['admin-locations'],
    queryFn: fetchAdminLocations,
  });
};