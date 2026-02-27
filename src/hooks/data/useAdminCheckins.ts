import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminCheckin {
  id: number;
  user_id: string;
  checkin_date: string;
  streak: number;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

const fetchAdminCheckins = async (): Promise<AdminCheckin[]> => {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*, profiles!fk_checkins_user_profile(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data as AdminCheckin[]) || [];
};

export const useAdminCheckins = () => {
  return useQuery<AdminCheckin[], Error>({
    queryKey: ['admin-checkins'],
    queryFn: fetchAdminCheckins,
    staleTime: 1000 * 60 * 2,
  });
};
