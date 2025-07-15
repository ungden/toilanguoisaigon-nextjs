import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardProfile } from '@/types/database';

const fetchLeaderboard = async (): Promise<LeaderboardProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, xp, level')
    .order('xp', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useLeaderboard = () => {
  return useQuery<LeaderboardProfile[], Error>({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });
};