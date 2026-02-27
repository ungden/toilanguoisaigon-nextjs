import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUserBadge {
  id: number;
  user_id: string;
  badge_id: number;
  awarded_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  badges: { name: string; icon_name: string | null } | null;
}

const fetchAdminUserBadges = async (): Promise<AdminUserBadge[]> => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, profiles!fk_user_badges_user_profile(full_name, avatar_url), badges(name, icon_name)')
    .order('awarded_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data as AdminUserBadge[]) || [];
};

export const useAdminUserBadges = () => {
  return useQuery<AdminUserBadge[], Error>({
    queryKey: ['admin-user-badges'],
    queryFn: fetchAdminUserBadges,
    staleTime: 1000 * 60 * 2,
  });
};
