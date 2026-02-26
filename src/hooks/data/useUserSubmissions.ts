import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LocationSubmission } from '@/types/database';

const fetchUserSubmissions = async (userId: string): Promise<LocationSubmission[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('location_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useUserSubmissions = (userId: string | undefined) => {
  return useQuery<LocationSubmission[], Error>({
    queryKey: ['user-submissions', userId],
    queryFn: () => fetchUserSubmissions(userId!),
    enabled: !!userId,
  });
};