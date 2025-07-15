"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge as BadgeType } from "@/types/database"
import { MoreHorizontal, Pencil, Trash, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import * as Icons from "lucide-react"

const Icon = ({ name, className }: { name: string; className?: string }) => {
  const LucideIcon = (Icons as any)[name];
  if (!LucideIcon) return <Award className={className} />;
  return <LucideIcon className={className} />;
};

export const columns = (options: { 
  onEdit: (badge: BadgeType) => void;
  onDelete: (badge: BadgeType) => void;
}): ColumnDef<BadgeType>[] => [
  {
    accessorKey: "icon_name",
    header: "Icon",
    cell: ({ row }) => (
      <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-full">
        <Icon name={row.original.icon_name || 'Award'} className="h-5 w-5 text-muted-foreground" />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên huy hiệu",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.description}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const badge = row.original
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
            <DropdownMenuItem onClick={() => options.onEdit(badge)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => options.onDelete(badge)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]