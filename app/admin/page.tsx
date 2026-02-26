"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminStats, type ActivityItem } from "@/hooks/data/useAdminStats";
import {
  MapPin,
  Users,
  Star,
  FileText,
  Clock,
  TrendingUp,
  Zap,
  CalendarCheck,
  Heart,
  PlusCircle,
  Inbox,
  BarChart3,
  Trophy,
  Send,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, description, color }: {
  title: string; value: number | string; icon: React.ComponentType<{ className?: string }>; description?: string; color: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const activityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'review':
      return <Star className="h-4 w-4 text-vietnam-gold-600" />;
    case 'submission':
      return <Send className="h-4 w-4 text-vietnam-blue-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const AdminDashboardPage = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Tổng quan</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-32 mt-1" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-40 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  const chartData = stats?.recentReviews.map(r => ({
    date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    'Đánh giá': r.count,
  })) || [];

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tổng quan</h1>
          <p className="text-muted-foreground">Chào mừng trở lại, {profile?.full_name || 'Admin'}!</p>
        </div>
      </div>

      {/* ─── Stat Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
        <StatCard
          title="Địa điểm"
          value={stats?.publishedLocations || 0}
          icon={MapPin}
          description={`${stats?.totalLocations || 0} tổng cộng (bao gồm draft)`}
          color="text-vietnam-red-600"
        />
        <StatCard
          title="Thành viên"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Tổng số người dùng đã đăng ký"
          color="text-vietnam-blue-600"
        />
        <StatCard
          title="Đánh giá"
          value={stats?.totalReviews || 0}
          icon={Star}
          description="Tổng số đánh giá từ cộng đồng"
          color="text-vietnam-gold-600"
        />
        <StatCard
          title="Bài viết"
          value={stats?.totalPosts || 0}
          icon={FileText}
          description="Bài viết đã xuất bản"
          color="text-green-600"
        />
        <StatCard
          title="Đang chờ duyệt"
          value={stats?.pendingSubmissions || 0}
          icon={Clock}
          description="Đề xuất địa điểm chờ xử lý"
          color="text-yellow-600"
        />
        <StatCard
          title="Tổng XP đã phát"
          value={stats?.totalXpAwarded?.toLocaleString('vi-VN') || '0'}
          icon={Zap}
          description="Tổng điểm kinh nghiệm toàn hệ thống"
          color="text-orange-500"
        />
        <StatCard
          title="Check-in hôm nay"
          value={stats?.dailyCheckinsToday || 0}
          icon={CalendarCheck}
          description="Số lượt điểm danh trong ngày"
          color="text-teal-600"
        />
        <StatCard
          title="Lượt lưu địa điểm"
          value={stats?.totalSavedLocations || 0}
          icon={Heart}
          description="Tổng số lần lưu yêu thích"
          color="text-pink-500"
        />
      </div>

      {/* ─── Charts + Activity + Quick Actions ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Bar chart - 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Đánh giá 7 ngày qua</CardTitle>
            <CardDescription>Số lượng đánh giá mới mỗi ngày</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Đánh giá" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Chưa có dữ liệu đánh giá
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - 1 col */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Truy cập nhanh các tính năng quản trị</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start gap-2 h-11">
              <Link href="/admin/locations">
                <PlusCircle className="h-4 w-4 text-vietnam-red-600" />
                Tạo địa điểm
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2 h-11">
              <Link href="/admin/posts">
                <FileText className="h-4 w-4 text-green-600" />
                Viết bài blog
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2 h-11">
              <Link href="/admin/submissions">
                <Inbox className="h-4 w-4 text-yellow-600" />
                Duyệt đóng góp
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2 h-11">
              <Link href="/admin/reviews">
                <BarChart3 className="h-4 w-4 text-vietnam-blue-600" />
                Quản lý đánh giá
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ─── Activity Feed + Top Locations ─────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>10 hoạt động mới nhất trên nền tảng</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      {activityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Chưa có hoạt động nào
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Địa điểm nổi bật</CardTitle>
            <CardDescription>Top 5 địa điểm có nhiều đánh giá nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topLocations && stats.topLocations.length > 0 ? (
              <div className="space-y-4">
                {stats.topLocations.map((loc, index) => (
                  <div key={loc.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{loc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-vietnam-gold-500 fill-vietnam-gold-500" />
                          {loc.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {loc.review_count} đánh giá
                        </span>
                      </div>
                    </div>
                    <Trophy className="h-4 w-4 text-vietnam-gold-500 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Chưa có dữ liệu địa điểm
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Review-to-Location Ratio (kept from original) ─────────── */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ đánh giá</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && stats.publishedLocations > 0 ? `${(stats.totalReviews / stats.publishedLocations).toFixed(1)}/nơi` : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Trung bình đánh giá mỗi địa điểm</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboardPage;
