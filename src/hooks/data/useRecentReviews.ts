import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewWithProfileAndLocation } from '@/types/database';

const fetchRecentReviews = async (limit: number): Promise<ReviewWithProfileAndLocation[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles!fk_reviews_user_profile(full_name, avatar_url),
      locations!inner(name, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as ReviewWithProfileAndLocation[]) || [];
};

export const useRecentReviews = (limit: number = 6) => {
  return useQuery<ReviewWithProfileAndLocation[], Error>({
    queryKey: ['recent-reviews', limit],
    queryFn: () => fetchRecentReviews(limit),
    staleTime: 1000 * 60 * 2,
  });
};
