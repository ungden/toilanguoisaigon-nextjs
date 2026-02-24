import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalLocations: number;
  totalUsers: number;
  totalReviews: number;
  totalPosts: number;
  pendingSubmissions: number;
  publishedLocations: number;
  recentReviews: { date: string; count: number }[];
}

const fetchAdminStats = async (): Promise<AdminStats> => {
  const [
    locationsResult,
    publishedResult,
    usersResult,
    reviewsResult,
    postsResult,
    submissionsResult,
  ] = await Promise.all([
    supabase.from('locations').select('id', { count: 'exact', head: true }),
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('location_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Get review counts for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const { data: recentReviewsData } = await supabase
    .from('reviews')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  const reviewsByDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    reviewsByDay[d.toISOString().split('T')[0]] = 0;
  }
  (recentReviewsData || []).forEach(r => {
    const day = r.created_at.split('T')[0];
    if (reviewsByDay[day] !== undefined) reviewsByDay[day]++;
  });

  return {
    totalLocations: locationsResult.count || 0,
    publishedLocations: publishedResult.count || 0,
    totalUsers: usersResult.count || 0,
    totalReviews: reviewsResult.count || 0,
    totalPosts: postsResult.count || 0,
    pendingSubmissions: submissionsResult.count || 0,
    recentReviews: Object.entries(reviewsByDay).map(([date, count]) => ({ date, count })),
  };
};

export const useAdminStats = () => {
  return useQuery<AdminStats, Error>({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 1000 * 60 * 2,
  });
};
