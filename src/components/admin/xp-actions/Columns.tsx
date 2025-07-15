"use client"

import { ColumnDef } from "@tanstack/react-table"
import { XpAction } from "@/types/database"
import { Pencil, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export const columns = (options: { 
  onEdit: (action: XpAction) => void;
}): ColumnDef<XpAction>[] => [
  {
    accessorKey: "action_name",
    header: "Tên hành động",
    cell: ({ row }) => <div className="font-mono text-sm">{row.original.action_name}</div>,
  },
  {
    accessorKey: "xp_value",
    header: "Điểm XP",
    cell: ({ row }) => (
      <div className="flex items-center font-bold text-vietnam-gold-600">
        <Zap className="h-4 w-4 mr-2" />
        {row.original.xp_value}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.description}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const action = row.original
      return (
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={() => options.onEdit(action)}>
            <Pencil className="mr-2 h-4 w-4" />
            Sửa
          </Button>
        </div>
      )
    },
  },
]