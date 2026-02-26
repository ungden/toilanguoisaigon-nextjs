import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserBadgeWithDetails } from '@/types/database';

export const useUserBadges = (userId: string | undefined) => {
  return useQuery<UserBadgeWithDetails[]>({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      return (data as UserBadgeWithDetails[]) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
