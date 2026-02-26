import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminXpLog {
  id: number;
  user_id: string;
  action_name: string;
  xp_value: number;
  metadata: unknown;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

const fetchAdminXpLogs = async (): Promise<AdminXpLog[]> => {
  const { data, error } = await supabase
    .from('user_xp_logs')
    .select('*, profiles(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data as AdminXpLog[]) || [];
};

export const useAdminXpLogs = () => {
  return useQuery<AdminXpLog[], Error>({
    queryKey: ['admin-xp-logs'],
    queryFn: fetchAdminXpLogs,
    staleTime: 1000 * 60 * 2,
  });
};
