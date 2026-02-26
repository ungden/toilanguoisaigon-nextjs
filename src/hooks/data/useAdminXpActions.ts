import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { XpAction } from '@/types/database';

const fetchAdminXpActions = async (): Promise<XpAction[]> => {
  const { data, error } = await supabase
    .from('xp_actions')
    .select('*')
    .order('action_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminXpActions = () => {
  return useQuery<XpAction[], Error>({
    queryKey: ['admin-xp-actions'],
    queryFn: fetchAdminXpActions,
  });
};