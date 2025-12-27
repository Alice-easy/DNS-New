import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href: string
    icon?: LucideIcon
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          {/* 装饰性圆环 */}
          <div
            className="absolute inset-0 rounded-full bg-primary/5 animate-ping"
            style={{ animationDuration: '3s' }}
          />
          <div className="relative rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <Icon className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>

        {action && (
          <Button asChild size="lg">
            <Link href={action.href}>
              {ActionIcon && <ActionIcon className="mr-2 h-5 w-5" />}
              {action.label}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
