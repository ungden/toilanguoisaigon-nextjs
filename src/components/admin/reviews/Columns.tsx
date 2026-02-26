"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ReviewWithProfileAndLocation } from "@/types/database"
import { MoreHorizontal, Star, Trash, Pencil, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export const columns = (options: { 
  onDelete: (review: ReviewWithProfileAndLocation) => void;
  onEdit: (review: ReviewWithProfileAndLocation) => void;
  onViewImages: (review: ReviewWithProfileAndLocation) => void;
}): ColumnDef<ReviewWithProfileAndLocation>[] => [
  {
    accessorKey: "profiles",
    header: "Người dùng",
    cell: ({ row }) => {
      const profile = row.original.profiles;
      const name = profile?.full_name || 'Người dùng ẩn danh';
      const fallback = name ? name[0].toUpperCase() : 'U';
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "comment",
    header: "Nội dung",
    cell: ({ row }) => (
      <p className="max-w-xs truncate">{row.original.comment || "Không có bình luận"}</p>
    )
  },
  {
    accessorKey: "rating",
    header: "Đánh giá",
    cell: ({ row }) => (
      <div className="flex items-center">
        <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
        {row.original.rating}
      </div>
    )
  },
  {
    id: "images",
    header: "Ảnh",
    cell: ({ row }) => {
      const imageUrls = row.original.image_urls;
      const count = imageUrls?.length || 0;
      if (count === 0) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <button
          type="button"
          onClick={() => options.onViewImages(row.original)}
          className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          aria-label={`Xem ${count} ảnh`}
        >
          <Badge variant="secondary" className="gap-1 cursor-pointer">
            <ImageIcon className="h-3 w-3" />
            {count}
          </Badge>
        </button>
      )
    }
  },
  {
    accessorKey: "locations",
    header: "Địa điểm",
    cell: ({ row }) => {
      const location = row.original.locations;
      if (!location) return "N/A";
      return (
        <Link href={`/place/${location.slug}`} className="hover:underline" target="_blank">
          {location.name}
        </Link>
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
      const review = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => options.onEdit(review)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            {review.image_urls?.length > 0 && (
              <DropdownMenuItem onClick={() => options.onViewImages(review)}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Xem ảnh ({review.image_urls.length})
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => options.onDelete(review)}
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
