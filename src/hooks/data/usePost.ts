import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Post } from '../../types/database';

const fetchPost = async (slug: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    // PostgREST error code for "exact one row not found"
    if (error.code === 'PGRST116') {
      console.warn(`Post with slug "${slug}" not found.`);
      return null;
    }
    console.error(`Error fetching post with slug ${slug}:`, error);
    throw new Error(error.message);
  }

  return data;
};

export const usePost = (slug: string) => {
  return useQuery<Post | null, Error>({
    queryKey: ['post', slug],
    queryFn: () => fetchPost(slug),
    enabled: !!slug,
  });
};