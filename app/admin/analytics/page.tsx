"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAnalytics } from "@/hooks/data/useAdminAnalytics";
import { MapPin, Star, Users } from "lucide-react";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  return `Tháng ${parseInt(month)}/${year}`;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const AdminAnalyticsPage = () => {
  const { data: analytics, isLoading, error } = useAdminAnalytics();

  if (error) {
    return <div className="text-destructive">Lỗi: {error.message}</div>;
  }

  if (isLoading || !analytics) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Báo cáo & Thống kê</h1>
          <p className="text-muted-foreground">Tổng quan dữ liệu và xu hướng của nền tảng.</p>
        </div>
        <LoadingSkeleton />
      </>
    );
  }

  const maxDistrictCount = analytics.districtCounts[0]?.count || 1;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Báo cáo & Thống kê</h1>
        <p className="text-muted-foreground">Tổng quan dữ liệu và xu hướng của nền tảng.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Địa điểm đã xuất bản"
          value={analytics.totalLocations}
          icon={MapPin}
          color="text-vietnam-red-600"
        />
        <StatCard
          title="Tổng đánh giá"
          value={analytics.totalReviews}
          icon={Star}
          color="text-vietnam-gold-600"
        />
        <StatCard
          title="Đăng ký (6 tháng)"
          value={analytics.totalUsers}
          icon={Users}
          color="text-vietnam-blue-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* District distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Địa điểm theo Quận</CardTitle>
            <CardDescription>Top 10 quận có nhiều địa điểm nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.districtCounts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-3">
                {analytics.districtCounts.map((dc) => (
                  <div key={dc.district} className="flex items-center gap-3">
                    <span className="text-sm w-28 truncate flex-shrink-0">{dc.district}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-vietnam-red-500 rounded-full transition-all"
                        style={{ width: `${(dc.count / maxDistrictCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{dc.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews by month */}
        <Card>
          <CardHeader>
            <CardTitle>Đánh giá theo tháng</CardTitle>
            <CardDescription>Số lượng đánh giá trong 6 tháng qua</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.reviewsByMonth.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tháng</TableHead>
                    <TableHead className="text-right">Số đánh giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.reviewsByMonth.map((rm) => (
                    <TableRow key={rm.month}>
                      <TableCell>{formatMonth(rm.month)}</TableCell>
                      <TableCell className="text-right font-semibold">{rm.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registrations by month */}
        <Card>
          <CardHeader>
            <CardTitle>Đăng ký theo tháng</CardTitle>
            <CardDescription>Số người dùng mới trong 6 tháng qua</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.registrationsByMonth.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tháng</TableHead>
                    <TableHead className="text-right">Số đăng ký</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.registrationsByMonth.map((rm) => (
                    <TableRow key={rm.month}>
                      <TableCell>{formatMonth(rm.month)}</TableCell>
                      <TableCell className="text-right font-semibold">{rm.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top reviewers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Reviewer</CardTitle>
            <CardDescription>Người dùng đánh giá nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topReviewers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead className="text-right">Số đánh giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topReviewers.map((reviewer, idx) => (
                    <TableRow key={reviewer.user_id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={reviewer.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(reviewer.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{reviewer.full_name || "Ẩn danh"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{reviewer.review_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminAnalyticsPage;
