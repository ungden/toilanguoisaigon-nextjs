"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, User, Bookmark, LogOut, Star, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  const { session, profile, signOut } = useAuth();
  const _router = useRouter();

  const getInitials = (name: string | undefined | null, email: string | undefined | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-8 flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-vietnam-red-600 fill-vietnam-red-600" />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-vietnam-red-600">
                  Tôi là người Sài Gòn
                </span>
                <span className="text-xs text-vietnam-blue-600 font-medium">
                  Khám phá ẩm thực
                </span>
              </div>
            </div>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            <Link
              href="/collections"
              className="text-vietnam-blue-700 hover:text-vietnam-red-600 transition-colors duration-200 font-semibold"
            >
              Bộ sưu tập
            </Link>
            <Link
              href="/blog"
              className="text-vietnam-blue-700 hover:text-vietnam-red-600 transition-colors duration-200 font-semibold"
            >
              Blog
            </Link>
            <Link
              href="/leaderboard"
              className="text-vietnam-blue-700 hover:text-vietnam-red-600 transition-colors duration-200 font-semibold"
            >
              Bảng xếp hạng
            </Link>
            <Link
              href="/about"
              className="text-vietnam-blue-700 hover:text-vietnam-red-600 transition-colors duration-200 font-semibold"
            >
              Về chúng tôi
            </Link>
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-vietnam-blue-700 hover:text-vietnam-red-600 hover:bg-vietnam-red-50"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-white">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Star className="h-6 w-6 text-vietnam-red-600 fill-vietnam-red-600" />
              <span className="font-bold text-vietnam-red-600">Tôi là người Sài Gòn</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-4">
                 <Link href="/collections" className="text-vietnam-blue-700 hover:text-vietnam-red-600 font-semibold transition-colors">Bộ sưu tập</Link>
                 <Link href="/blog" className="text-vietnam-blue-700 hover:text-vietnam-red-600 font-semibold transition-colors">Blog</Link>
                 <Link href="/leaderboard" className="text-vietnam-blue-700 hover:text-vietnam-red-600 font-semibold transition-colors">Bảng xếp hạng</Link>
                 <Link href="/about" className="text-vietnam-blue-700 hover:text-vietnam-red-600 font-semibold transition-colors">Về chúng tôi</Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-end space-x-1">
          <ThemeToggle />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-vietnam-red-50">
                  <Avatar className="h-10 w-10 border-2 border-vietnam-red-200">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-vietnam-red-100 text-vietnam-red-700 font-semibold">
                      {getInitials(profile?.full_name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border-vietnam-red-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-vietnam-blue-800">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-vietnam-blue-600">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-vietnam-red-200" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center text-vietnam-blue-700 hover:text-vietnam-red-600 hover:bg-vietnam-red-50">
                    <User className="mr-2 h-4 w-4" />
                    <span>Trang cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-notebook" className="flex items-center text-vietnam-blue-700 hover:text-vietnam-red-600 hover:bg-vietnam-red-50">
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Sổ tay của tôi</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/submit-location" className="flex items-center text-vietnam-blue-700 hover:text-vietnam-red-600 hover:bg-vietnam-red-50">
                    <Send className="mr-2 h-4 w-4" />
                    <span>Đóng góp địa điểm</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-vietnam-red-200" />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-vietnam-blue-700 hover:text-vietnam-red-600 hover:bg-vietnam-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="btn-vietnam">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
