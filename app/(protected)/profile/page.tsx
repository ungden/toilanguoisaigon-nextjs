"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, MessageSquare, History } from "lucide-react";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserReviewsList } from "@/components/profile/UserReviewsList";
import { ProfileGamification } from "@/components/profile/ProfileGamification";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { XpHistory } from "@/components/profile/XpHistory";
import { DailyCheckin } from "@/components/gamification/DailyCheckin";

const ProfilePage = () => {
    const { user, profile, role } = useAuth();

    const getInitials = (name: string | undefined | null) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase();
        }
        return user?.email?.[0].toUpperCase() || 'U';
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Left Sidebar - Profile Card */}
                <Card className="w-full md:w-80 md:sticky top-24">
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User Avatar'} />
                            <AvatarFallback className="text-3xl">{getInitials(profile?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-2xl">{profile?.full_name || 'Người dùng mới'}</CardTitle>
                            {role === 'admin' && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Admin
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">{profile?.bio || 'Chưa có tiểu sử.'}</p>
                    </CardContent>
                </Card>

                {/* Right Content */}
                <div className="flex-1 space-y-6">
                    {/* Daily Check-in */}
                    <DailyCheckin />

                    {/* Gamification Stats */}
                    {profile && <ProfileGamification profile={profile} />}

                    {/* Badges */}
                    {user && <ProfileBadges userId={user.id} />}

                    {/* Tabs */}
                    <Tabs defaultValue="reviews" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="reviews">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Đánh giá
                            </TabsTrigger>
                            <TabsTrigger value="xp-history">
                                <History className="h-4 w-4 mr-2" />
                                Lịch sử XP
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <User className="h-4 w-4 mr-2" />
                                Cá nhân
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="reviews" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quản lý đánh giá</CardTitle>
                                    <p className="text-muted-foreground">Xem, sửa hoặc xóa các đánh giá bạn đã gửi.</p>
                                </CardHeader>
                                <CardContent>
                                    <UserReviewsList />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="xp-history" className="mt-6">
                            {user && <XpHistory userId={user.id} />}
                        </TabsContent>
                        <TabsContent value="settings" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin cá nhân</CardTitle>
                                    <p className="text-muted-foreground">Cập nhật thông tin hiển thị công khai của bạn.</p>
                                </CardHeader>
                                <CardContent>
                                    <EditProfileForm onSuccess={() => {}} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
