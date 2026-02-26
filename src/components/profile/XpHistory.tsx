import { useXpHistory } from '@/hooks/data/useXpHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { History, Zap } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  CREATE_REVIEW: 'Viết đánh giá',
  SAVE_LOCATION: 'Lưu địa điểm',
  SUBMIT_LOCATION: 'Gửi địa điểm',
  SUBMIT_LOCATION_APPROVED: 'Địa điểm được duyệt',
  DAILY_LOGIN: 'Đăng nhập hàng ngày',
  DAILY_CHECKIN: 'Điểm danh',
  CHECKIN_STREAK_BONUS: 'Bonus streak',
};

interface XpHistoryProps {
  userId: string;
}

export function XpHistory({ userId }: XpHistoryProps) {
  const { data: logs, isLoading } = useXpHistory(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-vietnam-blue-800">
          <History className="h-5 w-5 text-vietnam-blue-500" />
          Lịch sử XP
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs && logs.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-vietnam-gold-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-vietnam-blue-800">
                      {ACTION_LABELS[log.action_name] || log.action_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('vi-VN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-vietnam-gold-100 text-vietnam-gold-700 font-bold">
                  +{log.xp_value} XP
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Chưa có hoạt động nào. Hãy bắt đầu khám phá để nhận XP!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
