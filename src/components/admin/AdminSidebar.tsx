"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  Users,
  FileText,
  Library,
  MessageSquare,
  Star,
  Inbox,
  Award,
  Zap,
  Badge,
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/admin/locations", icon: Map, label: "Địa điểm" },
  { href: "/admin/users", icon: Users, label: "Người dùng" },
  { href: "/admin/posts", icon: FileText, label: "Bài viết" },
  { href: "/admin/collections", icon: Library, label: "Bộ sưu tập" },
  { href: "/admin/reviews", icon: MessageSquare, label: "Đánh giá" },
  { href: "/admin/submissions", icon: Inbox, label: "Đóng góp" },
  { href: "/admin/levels", icon: Award, label: "Cấp độ" },
  { href: "/admin/xp-actions", icon: Zap, label: "Hành động XP" },
  { href: "/admin/badges", icon: Badge, label: "Huy hiệu" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Star className="h-6 w-6 text-vietnam-red-600" />
          <span className="">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
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
      </nav>
    </aside>
  );
}
