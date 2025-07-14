import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProfilePage = () => {
    const { user, profile } = useAuth();

    const getInitials = (name: string | undefined | null) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase();
        }
        return user?.email?.[0].toUpperCase() || 'U';
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Trang cá nhân</h1>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                                <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">{profile?.full_name || 'Người dùng mới'}</CardTitle>
                                <p className="text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Tiểu sử</h3>
                            <p className="text-muted-foreground">{profile?.bio || 'Chưa có tiểu sử.'}</p>
                        </div>
                        {/* Add more profile editing features here in the future */}
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default ProfilePage;