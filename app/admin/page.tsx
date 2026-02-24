"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminStats } from "@/hooks/data/useAdminStats";
import { MapPin, Users, Star, FileText, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, description, color }: {
  title: string; value: number | string; icon: any; description?: string; color: string;
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

const AdminDashboardPage = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h1 className="text-3xl font-bold">Tổng quan</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-32 mt-1" /></CardContent>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
          title="Tỷ lệ đánh giá"
          value={stats && stats.totalLocations > 0 ? `${(stats.totalReviews / stats.publishedLocations).toFixed(1)}/nơi` : '0'}
          icon={TrendingUp}
          description="Trung bình đánh giá mỗi địa điểm"
          color="text-purple-600"
        />
      </div>

      <Card>
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
    </>
  );
};

export default AdminDashboardPage;
