import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewWithProfileAndLocation } from '@/types/database';

const fetchAdminReviews = async (): Promise<ReviewWithProfileAndLocation[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (full_name, avatar_url),
      locations (name, slug)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin reviews:', error);
    throw new Error(error.message);
  }

  return data as ReviewWithProfileAndLocation[];
};

export const useAdminReviews = () => {
  return useQuery<ReviewWithProfileAndLocation[], Error>({
    queryKey: ['admin-reviews'],
    queryFn: fetchAdminReviews,
  });
};