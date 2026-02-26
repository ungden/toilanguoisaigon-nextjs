"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyCheckin, useCheckinStatus } from '@/hooks/data/useDailyCheckin';
import { useBadgeEvaluator } from '@/hooks/data/useBadgeEvaluator';
import { CalendarCheck, Flame, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function DailyCheckin() {
  const { user } = useAuth();
  const checkinMutation = useDailyCheckin();
  const evaluateBadges = useBadgeEvaluator();
  const { data: status, isLoading } = useCheckinStatus(user?.id);

  if (!user) {
    return (
      <Card className="border-vietnam-gold-200 bg-gradient-to-r from-vietnam-gold-50 to-vietnam-red-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-vietnam-gold-500" />
            <div>
              <p className="font-semibold text-vietnam-blue-800">Điểm danh hàng ngày</p>
              <p className="text-sm text-vietnam-blue-600">Đăng nhập để nhận XP mỗi ngày!</p>
            </div>
          </div>
          <Button asChild className="btn-vietnam" size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleCheckin = () => {
    checkinMutation.mutate(user.id, {
      onSuccess: (result) => {
        if (!result.already_checked_in) {
          evaluateBadges.mutate(user.id);
        }
      },
    });
  };

  const checkedIn = status?.checkedInToday ?? false;
  const streak = status?.currentStreak ?? 0;

  return (
    <Card className="border-vietnam-gold-200 bg-gradient-to-r from-vietnam-gold-50 to-vietnam-red-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarCheck className={`h-8 w-8 ${checkedIn ? 'text-green-500' : 'text-vietnam-gold-500'}`} />
            {streak > 0 && (
              <span className="absolute -top-1 -right-1 bg-vietnam-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {streak > 99 ? '99' : streak}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-vietnam-blue-800">
              {checkedIn ? 'Đã điểm danh hôm nay!' : 'Điểm danh hàng ngày'}
            </p>
            <p className="text-sm text-vietnam-blue-600">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Streak {streak} ngày
                  {!checkedIn && ' — Điểm danh để giữ streak!'}
                </span>
              )}
              {streak === 0 && !checkedIn && 'Bấm điểm danh để nhận 10 XP!'}
              {streak === 0 && checkedIn && 'Quay lại ngày mai để tăng streak!'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCheckin}
          disabled={checkedIn || checkinMutation.isPending || isLoading}
          className={checkedIn ? 'bg-green-500 hover:bg-green-500 cursor-default' : 'btn-vietnam'}
          size="sm"
        >
          {checkinMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : checkedIn ? (
            '✓ Đã điểm danh'
          ) : (
            'Điểm danh'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
