"use client"

import { ColumnDef } from "@tanstack/react-table"
import { LocationSubmission } from "@/types/database"
import { MoreHorizontal, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SubmissionWithProfile extends LocationSubmission {
  profiles: { full_name: string | null; email: string; } | null;
}

export const columns = (options: { 
  onView: (submission: SubmissionWithProfile) => void;
}): ColumnDef<SubmissionWithProfile>[] => [
  {
    accessorKey: "name",
    header: "Tên địa điểm",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "profiles",
    header: "Người gửi",
    cell: ({ row }) => <div>{row.original.profiles?.full_name || row.original.profiles?.email || 'N/A'}</div>,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge 
          className={cn({
            'bg-yellow-100 text-yellow-800': status === 'pending',
            'bg-green-100 text-green-800': status === 'approved',
            'bg-red-100 text-red-800': status === 'rejected',
          })}
        >
          {status === 'pending' ? 'Đang chờ' : status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
        </Badge>
      )
    }
  },
  {
    accessorKey: "created_at",
    header: "Ngày gửi",
    cell: ({ row }) => <div>{new Date(row.original.created_at).toLocaleDateString('vi-VN')}</div>
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const submission = row.original
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
            <DropdownMenuItem onClick={() => options.onView(submission)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết & Duyệt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]