import { useLevels } from '@/hooks/data/useLevels';
import { Profile } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Award } from 'lucide-react';

interface ProfileGamificationProps {
  profile: Profile;
}

export function ProfileGamification({ profile }: ProfileGamificationProps) {
  const { data: levels, isLoading } = useLevels();

  if (isLoading || !levels || !profile.level || profile.xp === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentLevel = levels.find(l => l.level === profile.level);
  const nextLevel = levels.find(l => l.level === (profile.level || 0) + 1);

  const xpForCurrentLevel = currentLevel?.xp_required || 0;
  const xpForNextLevel = nextLevel?.xp_required || (xpForCurrentLevel + (levels[1]?.xp_required || 100));

  const xpInCurrentLevel = profile.xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-vietnam-blue-800">
          <Award className="h-5 w-5 text-vietnam-gold-500" />
          Cấp độ & Danh hiệu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-vietnam-red-600">{currentLevel?.title || `Cấp ${profile.level}`}</p>
          <p className="text-sm text-muted-foreground mt-1">{currentLevel?.description}</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1 text-sm font-medium">
            <span className="text-vietnam-blue-700">Tiến độ</span>
            <span className="text-vietnam-gold-600 font-bold">{profile.xp} XP</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>Cấp {profile.level}</span>
            {nextLevel ? (
              <span>Cấp tiếp theo: {nextLevel.xp_required} XP</span>
            ) : (
              <span>Cấp tối đa</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}