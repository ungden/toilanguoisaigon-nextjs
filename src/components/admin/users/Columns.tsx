"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ProfileWithRole, AppRole } from "@/types/database"
import { ArrowUpDown, MoreHorizontal, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const getRole = (user: ProfileWithRole): AppRole => {
  const roleData = user.user_roles;
  if (Array.isArray(roleData) && roleData.length > 0) {
    return roleData[0].role;
  }
  if (roleData && !Array.isArray(roleData)) {
    return (roleData as { role: AppRole }).role;
  }
  return 'user';
};

export const columns = (options: { 
  onEditRole: (user: ProfileWithRole) => void;
}): ColumnDef<ProfileWithRole>[] => [
  {
    accessorKey: "full_name",
    header: "Người dùng",
    cell: ({ row }) => {
      const user = row.original;
      const name = user.full_name || 'Chưa có tên';
      const email = user.email;
      const avatarUrl = user.avatar_url;
      const fallback = name ? name[0].toUpperCase() : 'U';

      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        </div>
      )
    }
  },
  {
    id: "role",
    accessorKey: "user_roles",
    header: "Vai trò",
    cell: ({ row }) => {
      const role = getRole(row.original);
      return (
        <Badge 
          variant="secondary"
          className={cn({
            'bg-blue-100 text-blue-800': role === 'user',
            'bg-purple-100 text-purple-800': role === 'moderator',
            'bg-red-100 text-red-800': role === 'admin',
          })}
        >
          {role}
        </Badge>
      )
    }
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Ngày tham gia
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>{new Date(row.original.created_at).toLocaleDateString('vi-VN')}</div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => options.onEditRole(user)}>
              <Shield className="mr-2 h-4 w-4" />
              Thay đổi vai trò
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]