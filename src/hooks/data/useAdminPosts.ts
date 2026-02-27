import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/database';

const fetchAdminPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminPosts = () => {
  return useQuery<Post[], Error>({
    queryKey: ['admin-posts'],
    queryFn: fetchAdminPosts,
  });
};