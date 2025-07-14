import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { useState } from "react";

const ProfilePage = () => {
    const { user, profile } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User Avatar'} />
                                    <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{profile?.full_name || 'Người dùng mới'}</CardTitle>
                                    <p className="text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-vietnam-blue-600 border-vietnam-blue-600 hover:bg-vietnam-blue-50">
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Chỉnh sửa
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
                                        <DialogDescription>
                                            Cập nhật thông tin cá nhân của bạn. Nhấn lưu khi hoàn tất.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <EditProfileForm onSuccess={() => setIsEditDialogOpen(false)} />
                                </DialogContent>
                            </Dialog>
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