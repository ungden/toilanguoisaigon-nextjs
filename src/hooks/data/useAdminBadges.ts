import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/types/database';

const fetchAdminBadges = async (): Promise<Badge[]> => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin badges:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminBadges = () => {
  return useQuery<Badge[], Error>({
    queryKey: ['admin-badges'],
    queryFn: fetchAdminBadges,
  });
};