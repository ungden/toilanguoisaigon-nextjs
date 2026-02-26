import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewWithProfileAndLocation } from '@/types/database';

const fetchUserReviews = async (userId: string): Promise<ReviewWithProfileAndLocation[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      locations (name, slug)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as ReviewWithProfileAndLocation[];
};

export const useUserReviews = (userId: string | undefined) => {
  return useQuery<ReviewWithProfileAndLocation[], Error>({
    queryKey: ['user-reviews', userId],
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
  });
};