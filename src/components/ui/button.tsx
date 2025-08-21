import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-gaming-border bg-gaming-card/50 backdrop-blur-sm text-foreground hover:border-primary/50 hover:bg-gaming-card hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        ghost: "text-foreground hover:bg-gaming-card/50 hover:text-primary hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        hero: "bg-gradient-to-r from-primary via-secondary to-primary text-foreground font-bold tracking-wide hover:shadow-[0_0_30px_rgba(185,84,39,0.4)] hover:scale-105 active:scale-95 border border-primary/20",
        gaming: "bg-gaming-card border-2 border-gaming-border text-foreground hover:border-primary/50 hover:bg-gaming-card/80 hover:shadow-[0_0_20px_rgba(185,84,39,0.2)] hover:scale-[1.02] active:scale-[0.98]",
        neon: "bg-transparent border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_25px_rgba(185,84,39,0.5)] hover:scale-[1.02] active:scale-[0.98]",
        cyber: "bg-gradient-to-r from-gaming-darker to-gaming-dark border border-primary/30 text-foreground hover:border-primary hover:shadow-[0_0_20px_rgba(185,84,39,0.3)] hover:scale-[1.02] active:scale-[0.98]",
        success: "bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        warning: "bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-lg px-10 text-lg font-bold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
