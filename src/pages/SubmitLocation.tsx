import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionForm } from "@/components/submission/SubmissionForm";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubmissions } from "@/hooks/data/useUserSubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, Send } from "lucide-react";

const SubmitLocationPage = () => {
  const { user } = useAuth();
  const { data: submissions, isLoading, refetch } = useUserSubmissions(user?.id);

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Send className="h-7 w-7 text-vietnam-red-600" />
                  Đóng góp địa điểm mới
                </CardTitle>
                <CardDescription>
                  Biết một nơi hay ho? Chia sẻ với cộng đồng! Mỗi đóng góp của bạn đều giúp Sài Gòn trở nên phong phú hơn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubmissionForm onSuccess={() => refetch()} />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử đóng góp</CardTitle>
                <CardDescription>Các địa điểm bạn đã gửi sẽ xuất hiện ở đây.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : submissions && submissions.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {submissions.map(sub => (
                      <div key={sub.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">{sub.district}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn({
                              "text-yellow-600 border-yellow-400": sub.status === 'pending',
                              "text-green-600 border-green-400": sub.status === 'approved',
                              "text-red-600 border-red-400": sub.status === 'rejected',
                            })}
                          >
                            {sub.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {sub.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {sub.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {sub.status === 'pending' ? 'Đang chờ' : sub.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Bạn chưa gửi địa điểm nào.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmitLocationPage;