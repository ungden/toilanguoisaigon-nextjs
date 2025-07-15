import { LeaderboardProfile } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Award, Star } from 'lucide-react';

interface LeaderboardItemProps {
  profile: LeaderboardProfile;
  rank: number;
}

export function LeaderboardItem({ profile, rank }: LeaderboardItemProps) {
  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  const rankColors: { [key: number]: string } = {
    1: 'bg-amber-400 text-amber-900 border-amber-500',
    2: 'bg-slate-300 text-slate-800 border-slate-400',
    3: 'bg-orange-400 text-orange-900 border-orange-500',
  };

  return (
    <div className={cn(
      "flex items-center p-4 rounded-lg transition-all",
      rank <= 3 ? 'bg-opacity-20' : 'hover:bg-muted',
      {
        'bg-amber-100': rank === 1,
        'bg-slate-100': rank === 2,
        'bg-orange-100': rank === 3,
      }
    )}>
      <div className="flex items-center w-12">
        <span className={cn(
          "font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full border-2",
          rankColors[rank] || 'bg-muted text-muted-foreground border-border'
        )}>
          {rank}
        </span>
      </div>
      <div className="flex items-center gap-4 flex-1 ml-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'User'} />
          <AvatarFallback className="text-lg">{getInitials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-vietnam-blue-800">{profile.full_name || 'Người dùng ẩn danh'}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Award className="h-4 w-4 text-vietnam-red-500" />
            Cấp {profile.level}
          </p>
        </div>
      </div>
      <div className="flex items-center font-bold text-lg text-vietnam-gold-600">
        <Star className="h-5 w-5 mr-2 fill-current" />
        {profile.xp.toLocaleString('vi-VN')}
      </div>
    </div>
  );
}