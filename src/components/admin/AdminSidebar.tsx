"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Map,
  MapPinPlus,
  Users,
  FileText,
  Library,
  MessageSquare,
  Star,
  Inbox,
  Award,
  Zap,
  Badge,
  Menu,
  Activity,
  BarChart3,
  Heart,
  FolderOpen,
  Tag,
  Layers,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
    ],
  },
  {
    title: 'Nội dung',
    items: [
      { href: "/admin/locations", icon: Map, label: "Địa điểm" },
      { href: "/admin/import-maps", icon: MapPinPlus, label: "Import từ Maps" },
      { href: "/admin/posts", icon: FileText, label: "Bài viết" },
      { href: "/admin/collections", icon: Library, label: "Bộ sưu tập" },
      { href: "/admin/reviews", icon: MessageSquare, label: "Đánh giá" },
      { href: "/admin/submissions", icon: Inbox, label: "Đóng góp" },
    ],
  },
  {
    title: 'Phân loại',
    items: [
      { href: "/admin/categories", icon: FolderOpen, label: "Danh mục" },
      { href: "/admin/tags", icon: Tag, label: "Thẻ Tag" },
      { href: "/admin/collection-categories", icon: Layers, label: "Danh mục BST" },
    ],
  },
  {
    title: 'Gamification',
    items: [
      { href: "/admin/levels", icon: Award, label: "Cấp độ" },
      { href: "/admin/xp-actions", icon: Zap, label: "Hành động XP" },
      { href: "/admin/badges", icon: Badge, label: "Huy hiệu" },
      { href: "/admin/activity", icon: Activity, label: "Hoạt động" },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      { href: "/admin/users", icon: Users, label: "Người dùng" },
      { href: "/admin/analytics", icon: BarChart3, label: "Báo cáo" },
      { href: "/admin/saved-locations", icon: Heart, label: "Được lưu" },
    ],
  },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-auto py-2">
      {navGroups.map((group) => (
        <div key={group.title || 'main'} className="px-3 py-1">
          {group.title && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </p>
          )}
          <ul className="grid items-start text-sm font-medium">
            {group.items.map((item) => {
              const isActive = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <>
      {/* Mobile sidebar - hamburger menu */}
      <div className="sm:hidden sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Mở menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Star className="h-6 w-6 text-vietnam-red-600" />
                <span>Admin Panel</span>
              </Link>
            </div>
            <SidebarNav />
          </SheetContent>
        </Sheet>
        <Link href="/admin" className="ml-3 flex items-center gap-2 font-semibold">
          <Star className="h-5 w-5 text-vietnam-red-600" />
          <span className="text-sm">Admin Panel</span>
        </Link>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Star className="h-6 w-6 text-vietnam-red-600" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <SidebarNav />
      </aside>
    </>
  );
}
