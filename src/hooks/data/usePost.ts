import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Post } from '../../types/database';

const fetchPost = async (slug: string): Promise<Post | null> => {
  console.log('Fetching post with slug:', slug);
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    if (error.code === 'PGRST116') {
      console.warn(`Post with slug "${slug}" not found.`);
      return null;
    }
    throw new Error(error.message);
  }

  console.log('Post found:', data);

  // Thêm profile nếu có author_id
  if (data && data.author_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', data.author_id)
      .single();
    
    return {
      ...data,
      profiles: profile
    };
  }

  return {
    ...data,
    profiles: null
  };
};

export const usePost = (slug: string) => {
  return useQuery<Post | null, Error>({
    queryKey: ['post', slug],
    queryFn: () => fetchPost(slug),
    enabled: !!slug,
    retry: 2,
  });
};