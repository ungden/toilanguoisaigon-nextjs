import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Post } from '../../types/database';

const fetchPosts = async (): Promise<Post[]> => {
  try {
    console.log('Starting to fetch posts...');
    
    // Thử query đơn giản trước
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Raw posts data:', data);

    if (!data || data.length === 0) {
      console.log('No posts found in database');
      return [];
    }

    // Sau đó thêm profiles nếu cần
    const postsWithProfiles = await Promise.all(
      data.map(async (post) => {
        if (post.author_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', post.author_id)
            .single();
          
          return {
            ...post,
            profiles: profile
          };
        }
        return {
          ...post,
          profiles: null
        };
      })
    );

    console.log('Posts with profiles:', postsWithProfiles);
    return postsWithProfiles;

  } catch (error) {
    console.error('Error in fetchPosts:', error);
    throw error;
  }
};

export const usePosts = () => {
  return useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
};