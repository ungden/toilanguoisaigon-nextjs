import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';

/**
 * Badge criteria definitions.
 * Each entry maps a badge ID to a condition check.
 * Badge IDs correspond to seeded badges:
 * 1: Người mới (account created)
 * 2: Nhà phê bình (5 reviews)
 * 3: Reviewer chuyên nghiệp (20 reviews)
 * 4: Thám tử ẩm thực (10 saved locations)
 * 5: Sưu tầm viên (50 saved locations)
 * 6: Người đóng góp (3 submissions)
 * 7: Siêng năng (7-day streak)
 * 8: Kiên trì (30-day streak)
 * 9: Cấp 5 đạt được
 * 10: Cấp 10 đạt được
 */

interface BadgeCriteria {
  badgeId: number;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  reviewCount: number;
  savedCount: number;
  submissionCount: number;
  maxStreak: number;
  currentLevel: number;
}

const BADGE_CRITERIA: BadgeCriteria[] = [
  { badgeId: 1, check: () => true }, // Người mới - always qualifies once they have an account
  { badgeId: 2, check: (s) => s.reviewCount >= 5 },
  { badgeId: 3, check: (s) => s.reviewCount >= 20 },
  { badgeId: 4, check: (s) => s.savedCount >= 10 },
  { badgeId: 5, check: (s) => s.savedCount >= 50 },
  { badgeId: 6, check: (s) => s.submissionCount >= 3 },
  { badgeId: 7, check: (s) => s.maxStreak >= 7 },
  { badgeId: 8, check: (s) => s.maxStreak >= 30 },
  { badgeId: 9, check: (s) => s.currentLevel >= 5 },
  { badgeId: 10, check: (s) => s.currentLevel >= 10 },
];

/**
 * Evaluates badge criteria for a user and awards any newly earned badges.
 * Call this after any XP-awarding action (review, save, checkin, etc.)
 */
export const useBadgeEvaluator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<string[]> => {
      // 1. Get user's existing badges
      const { data: existingBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const earnedBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));

      // 2. Get user stats
      const [reviewResult, savedResult, submissionResult, streakResult, profileResult] = await Promise.all([
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('saved_locations').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('location_submissions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('daily_checkins').select('streak').eq('user_id', userId).order('streak', { ascending: false }).limit(1),
        supabase.from('profiles').select('level').eq('id', userId).single(),
      ]);

      const stats: UserStats = {
        reviewCount: reviewResult.count || 0,
        savedCount: savedResult.count || 0,
        submissionCount: submissionResult.count || 0,
        maxStreak: streakResult.data?.[0]?.streak || 0,
        currentLevel: profileResult.data?.level || 1,
      };

      // 3. Check which badges should be awarded
      const newBadgeNames: string[] = [];
      for (const criteria of BADGE_CRITERIA) {
        if (!earnedBadgeIds.has(criteria.badgeId) && criteria.check(stats)) {
          // Award badge
          const { error } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_id: criteria.badgeId });

          if (!error) {
            // Get badge name for notification
            const { data: badge } = await supabase
              .from('badges')
              .select('name')
              .eq('id', criteria.badgeId)
              .single();

            if (badge) {
              newBadgeNames.push(badge.name);
            }
          }
        }
      }

      return newBadgeNames;
    },
    onSuccess: (newBadges) => {
      if (newBadges.length > 0) {
        showSuccess(`Bạn đã nhận huy hiệu mới: ${newBadges.join(', ')}! 🏅`);
      }
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
  });
};
