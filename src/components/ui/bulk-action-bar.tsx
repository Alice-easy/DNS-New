"use client"

import * as React from "react"
import { X, Trash2, Download, Copy, Move, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface BulkAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary"
  disabled?: boolean
}

export interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  actions?: BulkAction[]
  moreActions?: BulkAction[]
  className?: string
}

/**
 * BulkActionBar - 批量操作浮动工具栏组件
 *
 * 当用户选中多个项目时,从屏幕底部滑入显示
 * 提供批量操作按钮(删除、导出、复制等)
 *
 * @example
 * ```tsx
 * <BulkActionBar
 *   selectedCount={selectedItems.length}
 *   onClear={() => setSelectedItems([])}
 *   actions={[
 *     {
 *       label: "删除",
 *       icon: Trash2,
 *       onClick: handleBulkDelete,
 *       variant: "destructive"
 *     },
 *     {
 *       label: "导出",
 *       icon: Download,
 *       onClick: handleBulkExport
 *     }
 *   ]}
 * />
 * ```
 */
export function BulkActionBar({
  selectedCount,
  onClear,
  actions = [],
  moreActions = [],
  className,
}: BulkActionBarProps) {
  // 只显示前3个主要操作,其余放入"更多"菜单
  const primaryActions = actions.slice(0, 3)
  const overflowActions = [...actions.slice(3), ...moreActions]

  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "animate-slide-in-up",
        className
      )}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm" />

      {/* 工具栏内容 */}
      <div className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-xl",
            "border border-border/50 bg-card/95 backdrop-blur-md",
            "p-4 shadow-2xl shadow-primary/10",
            "animate-fade-in"
          )}
        >
          {/* 左侧: 选中数量 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {selectedCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                已选中 {selectedCount} 项
              </p>
              <p className="text-xs text-muted-foreground">
                可执行批量操作
              </p>
            </div>
          </div>

          {/* 右侧: 操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 主要操作按钮 */}
            {primaryActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="default"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    "gap-2",
                    action.variant === "destructive" && "hover-glow"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              )
            })}

            {/* 更多操作下拉菜单 */}
            {overflowActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {overflowActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {action.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 清除选择按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="ml-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">清除选择</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 导出常用操作预设
export const commonBulkActions = {
  delete: (onClick: () => void): BulkAction => ({
    label: "删除",
    icon: Trash2,
    onClick,
    variant: "destructive" as const,
  }),
  export: (onClick: () => void): BulkAction => ({
    label: "导出",
    icon: Download,
    onClick,
  }),
  copy: (onClick: () => void): BulkAction => ({
    label: "复制",
    icon: Copy,
    onClick,
  }),
  move: (onClick: () => void): BulkAction => ({
    label: "移动",
    icon: Move,
    onClick,
  }),
}
