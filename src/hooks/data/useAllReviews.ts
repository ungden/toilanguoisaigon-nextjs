import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewWithProfileAndLocation } from '@/types/database';

interface UseAllReviewsOptions {
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'highest' | 'lowest';
  minRating?: number;
}

const fetchAllReviews = async (options: UseAllReviewsOptions = {}): Promise<{ reviews: ReviewWithProfileAndLocation[]; total: number }> => {
  const { limit = 20, offset = 0, sort = 'newest', minRating } = options;

  let query = supabase
    .from('reviews')
    .select(`
      *,
      profiles!fk_reviews_user_profile(full_name, avatar_url),
      locations!inner(name, slug, district, main_image_url)
    `, { count: 'exact' });

  if (minRating) {
    query = query.gte('rating', minRating);
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'highest') {
    query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
  } else if (sort === 'lowest') {
    query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return {
    reviews: (data as ReviewWithProfileAndLocation[]) || [],
    total: count || 0,
  };
};

export const useAllReviews = (options: UseAllReviewsOptions = {}) => {
  return useQuery<{ reviews: ReviewWithProfileAndLocation[]; total: number }, Error>({
    queryKey: ['all-reviews', options],
    queryFn: () => fetchAllReviews(options),
    staleTime: 1000 * 60 * 2,
  });
};
