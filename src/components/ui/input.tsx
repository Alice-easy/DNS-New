import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 基础样式
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2",
        "text-sm text-foreground placeholder:text-muted-foreground",
        // 过渡效果
        "transition-all duration-200",
        // 焦点样式
        "outline-none focus:border-ring focus:ring-2 focus:ring-ring/20",
        // 禁用状态
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // 错误状态
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // 暗黑模式
        "dark:bg-card/50 dark:border-border/50",
        // 文件输入特殊处理
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
