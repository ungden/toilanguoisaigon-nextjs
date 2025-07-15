import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard } from "@/hooks/data/useLeaderboard";
import { LeaderboardItem } from "@/components/leaderboard/LeaderboardItem";
import { Trophy } from "lucide-react";

const LeaderboardPage = () => {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <CardTitle className="text-3xl font-bold text-vietnam-blue-800">Bảng Xếp Hạng</CardTitle>
                <CardDescription>Vinh danh những thành viên đóng góp tích cực nhất cho cộng đồng.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center p-4 rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex items-center gap-4 flex-1 ml-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))
              ) : error ? (
                <p className="text-center text-destructive">Không thể tải bảng xếp hạng. Vui lòng thử lại sau.</p>
              ) : leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((profile, index) => (
                  <LeaderboardItem key={profile.id} profile={profile} rank={index + 1} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Chưa có ai trên bảng xếp hạng. Hãy là người đầu tiên!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LeaderboardPage;