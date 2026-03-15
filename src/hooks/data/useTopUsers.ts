import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';

export const useTopUsers = (limit: number = 50) => {
  return useQuery({
    queryKey: ['top-users', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url, xp, level')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as Pick<Profile, 'id' | 'full_name' | 'display_name' | 'avatar_url' | 'xp' | 'level'>[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
