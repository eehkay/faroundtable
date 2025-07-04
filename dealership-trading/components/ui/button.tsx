import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] focus-visible:ring-destructive/50",
        outline:
          "border bg-transparent hover:bg-accent hover:text-accent-foreground dark:border-[#2a2a2a] dark:hover:bg-[#2a2a2a]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-[#1a1a1a] dark:hover:bg-[#262626]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-[#1a1a1a]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md gap-1.5 px-3 py-2",
        lg: "h-11 rounded-md px-8 py-3",
        icon: "size-10",
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
  variant,
  size,
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
