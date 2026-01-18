"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
  Globe,
  FileText,
  Activity,
  Users,
  Shield,
  Bell,
  Settings,
  Database,
  Zap,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Icon mapping for Server Component compatibility
const iconMap: Record<string, LucideIcon> = {
  server: Server,
  globe: Globe,
  fileText: FileText,
  activity: Activity,
  users: Users,
  shield: Shield,
  bell: Bell,
  settings: Settings,
  database: Database,
  zap: Zap,
}

export type IconName = keyof typeof iconMap

interface StatCardProps {
  title: string
  value: string | number
  icon: IconName
  trend?: {
    value: number
    label: string
  }
  chart?: React.ReactNode
  color?: "blue" | "green" | "purple" | "orange"
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  chart,
  color = "blue"
}: StatCardProps) {
  const Icon = iconMap[icon] || Activity
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400",
    green: "from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400",
    purple: "from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400",
    orange: "from-orange-500/10 to-orange-500/5 text-orange-600 dark:text-orange-400",
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const trendColor = trend && trend.value > 0
    ? "text-green-600 dark:text-green-400"
    : trend && trend.value < 0
    ? "text-red-600 dark:text-red-400"
    : "text-muted-foreground"

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-md hover:scale-[1.02]",
      "border-border/50"
    )}>
      {/* 背景装饰 */}
      <div className={cn(
        "absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
        "bg-gradient-to-br",
        colorClasses[color]
      )} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "rounded-lg p-2.5 bg-gradient-to-br shadow-sm",
          colorClasses[color]
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 数值 */}
        <div className="text-3xl font-bold tracking-tight">
          {value}
        </div>

        {/* 趋势指标 */}
        {trend && (
          <div className="flex items-center gap-2 text-sm">
            <span className={cn("flex items-center gap-1 font-medium", trendColor)}>
              {getTrendIcon()}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}

        {/* 微型图表 */}
        {chart && (
          <div className="h-16 -mx-2 mt-4">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
