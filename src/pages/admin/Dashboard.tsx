import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboardPage = () => {
    const { profile } = useAuth();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h1 className="text-3xl font-bold">Tổng quan</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Chào mừng trở lại, {profile?.full_name || 'Admin'}!</CardTitle>
                    <CardDescription>Đây là khu vực quản trị của bạn.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Sử dụng thanh điều hướng bên trái để bắt đầu quản lý các phần của trang web.</p>
                    <p className="mt-4">Các số liệu thống kê và biểu đồ sẽ được thêm vào đây trong các giai đoạn phát triển tiếp theo.</p>
                </CardContent>
            </Card>
        </>
    );
};

export default AdminDashboardPage;