"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MoreVertical, LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DataField {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  badge?: {
    variant?: "default" | "secondary" | "destructive" | "outline"
    text: string
  }
  className?: string
}

export interface DataAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: "default" | "destructive" | "ghost"
  disabled?: boolean
}

export interface MobileDataCardProps {
  title: string
  subtitle?: string
  fields: DataField[]
  actions?: DataAction[]
  icon?: LucideIcon
  iconColor?: string
  onClick?: () => void
  selected?: boolean
  className?: string
}

/**
 * MobileDataCard - 移动端友好的数据展示卡片组件
 *
 * 用于在移动设备上替代传统表格显示数据
 * 提供更好的可读性和交互体验
 *
 * @example
 * ```tsx
 * <MobileDataCard
 *   title="example.com"
 *   subtitle="Cloudflare"
 *   icon={Globe}
 *   fields={[
 *     { label: "状态", value: "活跃", badge: { variant: "default", text: "活跃" } },
 *     { label: "记录数", value: "12" },
 *     { label: "更新时间", value: "2小时前" }
 *   ]}
 *   actions={[
 *     { label: "编辑", icon: Edit, onClick: handleEdit },
 *     { label: "删除", icon: Trash, onClick: handleDelete, variant: "destructive" }
 *   ]}
 * />
 * ```
 */
export function MobileDataCard({
  title,
  subtitle,
  fields,
  actions = [],
  icon: Icon,
  iconColor = "text-primary",
  onClick,
  selected = false,
  className,
}: MobileDataCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        selected && "ring-2 ring-primary ring-offset-2",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header: 标题和操作 */}
        <div className="flex items-start justify-between gap-3">
          {/* 图标和标题 */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {Icon && (
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                "bg-primary/10"
              )}>
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* 操作菜单 */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">操作菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {actions.map((action, index) => {
                  const ActionIcon = action.icon
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick()
                      }}
                      disabled={action.disabled}
                      className={cn(
                        action.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Fields: 数据字段 */}
        <div className="grid grid-cols-1 gap-3">
          {fields.map((field, index) => {
            const FieldIcon = field.icon
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between gap-2",
                  "py-2 border-b border-border/50 last:border-0",
                  field.className
                )}
              >
                {/* 字段标签 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {FieldIcon && <FieldIcon className="h-3.5 w-3.5" />}
                  <span>{field.label}</span>
                </div>

                {/* 字段值 */}
                <div className="flex items-center gap-2">
                  {field.badge ? (
                    <Badge
                      variant={field.badge.variant || "default"}
                      className="font-medium"
                    >
                      {field.badge.text}
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {field.value}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * MobileDataList - 移动端数据列表容器
 *
 * 用于包装多个 MobileDataCard 组件
 */
export interface MobileDataListProps {
  children: React.ReactNode
  className?: string
}

export function MobileDataList({ children, className }: MobileDataListProps) {
  return (
    <div className={cn("space-y-3 animate-fade-in", className)}>
      {children}
    </div>
  )
}

/**
 * ResponsiveDataView - 响应式数据视图容器
 *
 * 自动在桌面端显示表格,移动端显示卡片
 */
export interface ResponsiveDataViewProps {
  desktopView: React.ReactNode
  mobileView: React.ReactNode
  className?: string
}

export function ResponsiveDataView({
  desktopView,
  mobileView,
  className,
}: ResponsiveDataViewProps) {
  return (
    <div className={className}>
      {/* 桌面端表格 */}
      <div className="hidden md:block">{desktopView}</div>

      {/* 移动端卡片 */}
      <div className="block md:hidden">{mobileView}</div>
    </div>
  )
}
