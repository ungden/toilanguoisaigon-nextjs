"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminXpLogs } from "@/hooks/data/useAdminXpLogs";
import { useAdminCheckins } from "@/hooks/data/useAdminCheckins";
import { useAdminUserBadges } from "@/hooks/data/useAdminUserBadges";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function XpLogsTab() {
  const { data: logs, isLoading, error } = useAdminXpLogs();

  if (error) return <div className="text-destructive">Lỗi: {error.message}</div>;
  if (isLoading) return <LoadingSkeleton />;

  if (!logs || logs.length === 0) {
    return <p className="text-muted-foreground py-4 text-center">Chưa có dữ liệu XP.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Người dùng</TableHead>
          <TableHead>Hành động</TableHead>
          <TableHead className="text-right">XP</TableHead>
          <TableHead className="text-right">Thời gian</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={log.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(log.profiles?.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{log.profiles?.full_name || "Ẩn danh"}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm">{log.action_name}</TableCell>
            <TableCell className="text-right font-semibold text-green-600">+{log.xp_value}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">{formatDate(log.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CheckinsTab() {
  const { data: checkins, isLoading, error } = useAdminCheckins();

  if (error) return <div className="text-destructive">Lỗi: {error.message}</div>;
  if (isLoading) return <LoadingSkeleton />;

  if (!checkins || checkins.length === 0) {
    return <p className="text-muted-foreground py-4 text-center">Chưa có dữ liệu check-in.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Người dùng</TableHead>
          <TableHead>Ngày check-in</TableHead>
          <TableHead className="text-right">Streak</TableHead>
          <TableHead className="text-right">Thời gian</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checkins.map((checkin) => (
          <TableRow key={checkin.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={checkin.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(checkin.profiles?.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{checkin.profiles?.full_name || "Ẩn danh"}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm">{formatDateShort(checkin.checkin_date)}</TableCell>
            <TableCell className="text-right font-semibold">
              {checkin.streak} ngày
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">{formatDate(checkin.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UserBadgesTab() {
  const { data: userBadges, isLoading, error } = useAdminUserBadges();

  if (error) return <div className="text-destructive">Lỗi: {error.message}</div>;
  if (isLoading) return <LoadingSkeleton />;

  if (!userBadges || userBadges.length === 0) {
    return <p className="text-muted-foreground py-4 text-center">Chưa có huy hiệu nào được cấp.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Người dùng</TableHead>
          <TableHead>Huy hiệu</TableHead>
          <TableHead className="text-right">Ngày cấp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userBadges.map((ub) => (
          <TableRow key={ub.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={ub.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(ub.profiles?.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{ub.profiles?.full_name || "Ẩn danh"}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm font-medium">{ub.badges?.name || "Không rõ"}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">{formatDate(ub.awarded_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const AdminActivityPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động Người dùng</CardTitle>
        <CardDescription>Theo dõi lịch sử XP, check-in và huy hiệu của người dùng.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="xp-logs">
          <TabsList className="mb-4">
            <TabsTrigger value="xp-logs">Lịch sử XP</TabsTrigger>
            <TabsTrigger value="checkins">Check-in</TabsTrigger>
            <TabsTrigger value="badges">Huy hiệu đã cấp</TabsTrigger>
          </TabsList>

          <TabsContent value="xp-logs">
            <XpLogsTab />
          </TabsContent>

          <TabsContent value="checkins">
            <CheckinsTab />
          </TabsContent>

          <TabsContent value="badges">
            <UserBadgesTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminActivityPage;
