import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboardPage = () => {
    const { profile } = useAuth();

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Chào mừng, {profile?.full_name || 'Admin'}!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Đây là khu vực quản trị. Các chức năng quản lý sẽ được phát triển ở đây.</p>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboardPage;