import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DistrictCount {
  district: string;
  count: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface TopReviewer {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  review_count: number;
}

export interface AdminAnalytics {
  districtCounts: DistrictCount[];
  reviewsByMonth: MonthCount[];
  registrationsByMonth: MonthCount[];
  topReviewers: TopReviewer[];
  totalLocations: number;
  totalReviews: number;
  totalUsers: number;
}

function groupByMonth(dates: string[]): MonthCount[] {
  const counts: Record<string, number> = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = 0;
  }

  dates.forEach((dateStr) => {
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (counts[key] !== undefined) {
      counts[key]++;
    }
  });

  return Object.entries(counts).map(([month, count]) => ({ month, count }));
}

const fetchAdminAnalytics = async (): Promise<AdminAnalytics> => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString();

  const [
    locationsResult,
    reviewsResult,
    profilesResult,
    reviewsWithUserResult,
  ] = await Promise.all([
    supabase
      .from('locations')
      .select('district')
      .eq('status', 'published'),
    supabase
      .from('reviews')
      .select('created_at, user_id')
      .gte('created_at', sixMonthsAgoISO)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sixMonthsAgoISO)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('user_id, profiles(full_name, avatar_url)'),
  ]);

  // District counts
  const districtMap: Record<string, number> = {};
  (locationsResult.data || []).forEach((loc) => {
    const d = loc.district || 'Không rõ';
    districtMap[d] = (districtMap[d] || 0) + 1;
  });
  const districtCounts: DistrictCount[] = Object.entries(districtMap)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Reviews by month
  const reviewDates = (reviewsResult.data || []).map((r) => r.created_at);
  const reviewsByMonth = groupByMonth(reviewDates);

  // Registrations by month
  const profileDates = (profilesResult.data || []).map((p) => p.created_at);
  const registrationsByMonth = groupByMonth(profileDates);

  // Top reviewers
  const reviewerMap: Record<string, { full_name: string | null; avatar_url: string | null; count: number }> = {};
  const reviewsWithUserData = (reviewsWithUserResult.data || []) as unknown as { user_id: string; profiles: { full_name: string | null; avatar_url: string | null } | null }[];
  reviewsWithUserData.forEach((r) => {
    const uid = r.user_id;
    if (!reviewerMap[uid]) {
      reviewerMap[uid] = {
        full_name: r.profiles?.full_name || null,
        avatar_url: r.profiles?.avatar_url || null,
        count: 0,
      };
    }
    reviewerMap[uid].count++;
  });
  const topReviewers: TopReviewer[] = Object.entries(reviewerMap)
    .map(([user_id, info]) => ({
      user_id,
      full_name: info.full_name,
      avatar_url: info.avatar_url,
      review_count: info.count,
    }))
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 10);

  return {
    districtCounts,
    reviewsByMonth,
    registrationsByMonth,
    topReviewers,
    totalLocations: locationsResult.data?.length || 0,
    totalReviews: reviewsWithUserResult.data?.length || 0,
    totalUsers: profilesResult.data?.length || 0,
  };
};

export const useAdminAnalytics = () => {
  return useQuery<AdminAnalytics, Error>({
    queryKey: ['admin-analytics'],
    queryFn: fetchAdminAnalytics,
    staleTime: 1000 * 60 * 5,
  });
};
