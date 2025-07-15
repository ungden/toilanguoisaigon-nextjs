"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Post } from "@/types/database"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const columns = (options: { 
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}): ColumnDef<Post>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Tiêu đề
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: "profiles",
    header: "Tác giả",
    cell: ({ row }) => <div>{row.original.profiles?.full_name || 'N/A'}</div>,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge 
          className={cn({
            'bg-green-100 text-green-800': status === 'published',
            'bg-yellow-100 text-yellow-800': status === 'draft',
          })}
        >
          {status === 'published' ? 'Xuất bản' : 'Nháp'}
        </Badge>
      )
    }
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => <div>{new Date(row.original.created_at).toLocaleDateString('vi-VN')}</div>
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const post = row.original
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
            <DropdownMenuItem onClick={() => options.onEdit(post)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => options.onDelete(post)}
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