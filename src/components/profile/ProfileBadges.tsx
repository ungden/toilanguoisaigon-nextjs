import { useUserBadges } from '@/hooks/data/useUserBadges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Baby, MessageSquare, MessageCircle, Bookmark, Library,
  MapPin, Flame, Trophy, Award, Crown, HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  baby: Baby,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  bookmark: Bookmark,
  library: Library,
  'map-pin': MapPin,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  crown: Crown,
};

interface ProfileBadgesProps {
  userId: string;
}

export function ProfileBadges({ userId }: ProfileBadgesProps) {
  const { data: userBadges, isLoading } = useUserBadges(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-16 rounded-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-vietnam-blue-800">
          <Trophy className="h-5 w-5 text-vietnam-gold-500" />
          Huy hiệu ({userBadges?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userBadges && userBadges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {userBadges.map((ub) => {
              const IconComp = ICON_MAP[ub.badges.icon_name || ''] || HelpCircle;
              return (
                <div
                  key={ub.id}
                  className="flex flex-col items-center gap-1 group"
                  title={ub.badges.description || ub.badges.name}
                >
                  <div className="w-14 h-14 rounded-full bg-vietnam-gold-100 border-2 border-vietnam-gold-300 flex items-center justify-center group-hover:bg-vietnam-gold-200 transition-colors">
                    <IconComp className="h-6 w-6 text-vietnam-gold-600" />
                  </div>
                  <span className="text-xs text-center text-vietnam-blue-600 max-w-16 leading-tight">
                    {ub.badges.name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Badge variant="outline" className="text-muted-foreground">
              Chưa có huy hiệu nào — Hãy bắt đầu khám phá!
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
