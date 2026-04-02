'use client'

import { MoreVertical, Pencil, Trash2, Eye, Copy, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface TableDropdownMenuProps {
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  onCopy?: () => void
  label?: string
  size?: 'sm' | 'default'
  showLabel?: boolean
  showAsButtons?: boolean // New prop to show as buttons instead of dropdown
}

export function TableDropdownMenu({
  onEdit,
  onDelete,
  onView,
  onCopy,
  label = 'Aksi',
  size = 'default',
  showLabel = false,
  showAsButtons = false
}: TableDropdownMenuProps) {
  // If showAsButtons is true, render buttons directly instead of dropdown
  if (showAsButtons) {
    return (
      <div className="flex items-center gap-1 justify-center">
        {onView && (
          <Button
            variant="ghost"
            size={size}
            onClick={onView}
            className="hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size={size}
            onClick={onEdit}
            className="hover:bg-blue-50 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size={size}
            onClick={onDelete}
            className="hover:bg-red-50 text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  // Original dropdown behavior
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <MoreVertical className="w-4 h-4 text-slate-600" />
          {showLabel && <span className="ml-2 text-sm text-slate-600">{label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onView && (
          <DropdownMenuItem onClick={onView} className="cursor-pointer">
            <Eye className="w-4 h-4 mr-2 text-blue-600" />
            <span>Lihat Detail</span>
          </DropdownMenuItem>
        )}
        {onCopy && (
          <DropdownMenuItem onClick={onCopy} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2 text-slate-600" />
            <span>Salin</span>
          </DropdownMenuItem>
        )}
        {onEdit && (
          <>
            {(onView || onCopy) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Pencil className="w-4 h-4 mr-2 text-blue-600" />
              <span>Edit</span>
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Hapus</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface TableActionsHeaderProps {
  selectedCount: number
  onClearSelection: () => void
  onEditSelected?: () => void
  onDeleteSelected?: () => void
  onViewSelected?: () => void
}

export function TableActionsHeader({
  selectedCount,
  onClearSelection,
  onEditSelected,
  onDeleteSelected,
  onViewSelected
}: TableActionsHeaderProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          {selectedCount} item{selectedCount > 1 ? 's' : ''} dipilih
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onViewSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewSelected}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {onEditSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditSelected}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        {onDeleteSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteSelected}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-slate-600 hover:text-slate-700 hover:bg-slate-200"
        >
          Batal
        </Button>
      </div>
    </div>
  )
}
