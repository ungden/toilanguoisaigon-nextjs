import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Post } from '../../types/database';

const fetchPosts = async (): Promise<Post[]> => {
  console.log('Fetching posts...');
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw new Error(error.message);
  }

  console.log('Posts fetched:', data);
  return data || [];
};

export const usePosts = () => {
  return useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
};