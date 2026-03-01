import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/database';

/**
 * Fetch blog posts that reference a given location slug in their related_location_slugs array.
 */
const fetchRelatedBlogPosts = async (locationSlug: string): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_url, reading_time, published_at, category')
    .eq('status', 'published')
    .contains('related_location_slugs', [locationSlug])
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(4);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Post[]) || [];
};

export const useRelatedBlogPosts = (locationSlug: string) => {
  return useQuery<Post[], Error>({
    queryKey: ['related-blog-posts', locationSlug],
    queryFn: () => fetchRelatedBlogPosts(locationSlug),
    enabled: !!locationSlug,
    staleTime: 1000 * 60 * 10,
  });
};
