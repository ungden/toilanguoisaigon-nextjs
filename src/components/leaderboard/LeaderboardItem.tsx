import { LeaderboardProfile } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Award, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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

  const isVerified = profile.level >= 10;

  return (
    <Link href={`/profile/${profile.id}`} className="block">
      <div className={cn(
        "flex items-center p-4 rounded-lg transition-all group",
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
          <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-vietnam-red-200 transition-colors">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
            <AvatarFallback className="text-lg bg-vietnam-red-100 text-vietnam-red-700 font-semibold">{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-vietnam-blue-800 group-hover:text-vietnam-red-600 transition-colors truncate max-w-[200px] sm:max-w-xs">
                {profile.full_name || 'Người dùng ẩn danh'}
              </p>
              {isVerified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-100" aria-label="Verified User" />
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Award className="h-4 w-4 text-vietnam-red-500" />
              Cấp {profile.level}
            </p>
          </div>
        </div>
        <div className="flex items-center font-bold text-lg text-vietnam-gold-600 group-hover:scale-110 transition-transform">
          <Star className="h-5 w-5 mr-2 fill-current" />
          {profile.xp.toLocaleString('vi-VN')}
        </div>
      </div>
    </Link>
  );
}