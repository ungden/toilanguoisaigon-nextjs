import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalLocations: number;
  totalUsers: number;
  totalReviews: number;
  totalPosts: number;
  pendingSubmissions: number;
  publishedLocations: number;
  totalXpAwarded: number;
  dailyCheckinsToday: number;
  totalSavedLocations: number;
  recentReviews: { date: string; count: number }[];
  topLocations: { id: string; name: string; slug: string; review_count: number; average_rating: number }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'review' | 'submission';
  title: string;
  subtitle: string;
  created_at: string;
}

const fetchAdminStats = async (): Promise<AdminStats> => {
  const today = new Date().toISOString().split('T')[0];

  const [
    locationsResult,
    publishedResult,
    usersResult,
    reviewsResult,
    postsResult,
    submissionsResult,
    xpResult,
    checkinsResult,
    savedResult,
    topLocationsResult,
    recentReviewsActivity,
    recentSubmissionsActivity,
  ] = await Promise.all([
    supabase.from('locations').select('id', { count: 'exact', head: true }),
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('location_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    // Total XP awarded
    supabase.from('user_xp_logs').select('xp_value'),
    // Daily check-ins today
    supabase.from('daily_checkins').select('id', { count: 'exact', head: true }).eq('checkin_date', today),
    // Total saved locations
    supabase.from('saved_locations').select('id', { count: 'exact', head: true }),
    // Top 5 locations by review_count
    supabase
      .from('locations')
      .select('id, name, slug, review_count, average_rating')
      .eq('status', 'published')
      .order('review_count', { ascending: false })
      .limit(5),
    // Recent 5 reviews for activity feed
    supabase
      .from('reviews')
      .select('id, created_at, profiles!fk_reviews_user_profile(full_name), locations(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    // Recent 5 submissions for activity feed
    supabase
      .from('location_submissions')
      .select('id, created_at, name, profiles!fk_submissions_user_profile(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Calculate total XP
  const totalXpAwarded = (xpResult.data || []).reduce((sum, row) => sum + (row.xp_value || 0), 0);

  // Build activity feed
  const activityItems: ActivityItem[] = [];

  const recentReviewsActivityData = (recentReviewsActivity.data || []) as unknown as { id: string; created_at: string; profiles: { full_name: string | null } | null; locations: { name: string } | null }[];
  recentReviewsActivityData.forEach((r) => {
    activityItems.push({
      id: `review-${r.id}`,
      type: 'review',
      title: `${r.profiles?.full_name || 'Ẩn danh'} đã đánh giá`,
      subtitle: r.locations?.name || 'Địa điểm',
      created_at: r.created_at,
    });
  });

  const recentSubmissionsActivityData = (recentSubmissionsActivity.data || []) as unknown as { id: string; created_at: string; name: string; profiles: { full_name: string | null } | null }[];
  recentSubmissionsActivityData.forEach((s) => {
    activityItems.push({
      id: `submission-${s.id}`,
      type: 'submission',
      title: `${s.profiles?.full_name || 'Ẩn danh'} đề xuất địa điểm`,
      subtitle: s.name || 'Địa điểm mới',
      created_at: s.created_at,
    });
  });

  activityItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    totalXpAwarded,
    dailyCheckinsToday: checkinsResult.count || 0,
    totalSavedLocations: savedResult.count || 0,
    recentReviews: Object.entries(reviewsByDay).map(([date, count]) => ({ date, count })),
    topLocations: (topLocationsResult.data || []).map(l => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      review_count: l.review_count,
      average_rating: l.average_rating,
    })),
    recentActivity: activityItems.slice(0, 10),
  };
};

export const useAdminStats = () => {
  return useQuery<AdminStats, Error>({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 1000 * 60 * 2,
  });
};
