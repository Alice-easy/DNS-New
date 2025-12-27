import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  cn(
    // 基础样式
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    // 焦点样式
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // 图标样式
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary text-primary-foreground shadow-sm",
          "hover:bg-primary/90 hover:shadow-md",
          "active:scale-[0.98]"
        ),
        destructive: cn(
          "bg-destructive text-white shadow-sm",
          "hover:bg-destructive/90 hover:shadow-md",
          "active:scale-[0.98]"
        ),
        outline: cn(
          "border-2 border-border bg-background shadow-xs",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
          "dark:bg-card/50 dark:border-border/50 dark:hover:bg-card"
        ),
        secondary: cn(
          "bg-secondary text-secondary-foreground shadow-xs",
          "hover:bg-secondary/80"
        ),
        ghost: cn(
          "hover:bg-accent hover:text-accent-foreground",
          "dark:hover:bg-accent/50"
        ),
        link: cn(
          "text-primary underline-offset-4",
          "hover:underline"
        ),
        success: cn(
          "bg-success text-white shadow-sm",
          "hover:opacity-90 hover:shadow-md",
          "active:scale-[0.98]"
        ),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
