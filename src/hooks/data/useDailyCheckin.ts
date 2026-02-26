import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyCheckinResult, DailyCheckin } from '@/types/database';
import { showSuccess } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

/** Check-in for today — calls the daily_checkin() DB function */
export const useDailyCheckin = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (userId: string): Promise<DailyCheckinResult> => {
      const { data, error } = await supabase.rpc('daily_checkin', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data as DailyCheckinResult;
    },
    onSuccess: (result) => {
      if (!result.already_checked_in) {
        if (result.leveled_up) {
          showSuccess(`Điểm danh thành công! +${result.xp_awarded} XP — Chúc mừng lên cấp mới! 🎉`);
        } else if (result.streak && result.streak > 1) {
          showSuccess(`Điểm danh thành công! Streak ${result.streak} ngày — +${result.xp_awarded} XP 🔥`);
        } else {
          showSuccess(`Điểm danh thành công! +${result.xp_awarded} XP`);
        }
      }
      // Refresh profile to update XP/level in UI
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['checkin-status'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-history'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['xp-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
  });
};

/** Get today's check-in status and current streak */
export const useCheckinStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['checkin-status', userId],
    queryFn: async (): Promise<{ checkedInToday: boolean; currentStreak: number }> => {
      if (!userId) return { checkedInToday: false, currentStreak: 0 };

      const today = new Date().toISOString().split('T')[0];

      // Check today's record
      const { data: todayData } = await supabase
        .from('daily_checkins')
        .select('streak')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .maybeSingle();

      if (todayData) {
        return { checkedInToday: true, currentStreak: todayData.streak };
      }

      // Check yesterday for continuing streak info
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const { data: yesterdayData } = await supabase
        .from('daily_checkins')
        .select('streak')
        .eq('user_id', userId)
        .eq('checkin_date', yesterday)
        .maybeSingle();

      return {
        checkedInToday: false,
        currentStreak: yesterdayData?.streak || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

/** Get check-in history (last 30 days) */
export const useCheckinHistory = (userId: string | undefined) => {
  return useQuery<DailyCheckin[]>({
    queryKey: ['checkin-history', userId],
    queryFn: async () => {
      if (!userId) return [];

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('checkin_date', thirtyDaysAgo)
        .order('checkin_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
