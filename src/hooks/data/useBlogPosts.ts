import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/database';

interface BlogPostsOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
}

interface BlogPostsResult {
  posts: Post[];
  totalCount: number;
  totalPages: number;
}

const fetchBlogPosts = async (options: BlogPostsOptions): Promise<BlogPostsResult> => {
  const { page = 1, pageSize = 12, category, tag } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('posts')
    .select('*, profiles!fk_posts_author_profile(full_name, avatar_url)', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  const totalCount = count || 0;

  return {
    posts: (data as Post[]) || [],
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

export const useBlogPosts = (options: BlogPostsOptions = {}) => {
  return useQuery<BlogPostsResult, Error>({
    queryKey: ['blog-posts', options.page, options.pageSize, options.category, options.tag],
    queryFn: () => fetchBlogPosts(options),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};
