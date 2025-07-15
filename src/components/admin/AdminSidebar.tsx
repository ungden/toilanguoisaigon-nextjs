import { NavLink } from "react-router-dom";
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
} from "lucide-react";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
  { to: "/admin/locations", icon: Map, label: "Địa điểm" },
  { to: "/admin/users", icon: Users, label: "Người dùng" },
  { to: "/admin/posts", icon: FileText, label: "Bài viết" },
  { to: "/admin/collections", icon: Library, label: "Bộ sưu tập" },
  { to: "/admin/reviews", icon: MessageSquare, label: "Đánh giá" },
  { to: "/admin/submissions", icon: Inbox, label: "Đóng góp" },
  { to: "/admin/levels", icon: Award, label: "Cấp độ" },
  { to: "/admin/xp-actions", icon: Zap, label: "Hành động XP" },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <Star className="h-6 w-6 text-vietnam-red-600" />
          <span className="">Admin Panel</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}