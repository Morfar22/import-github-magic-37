import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] border border-primary/20",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] border border-destructive/30",
        outline:
          "border-2 border-gaming-border bg-gaming-card/60 backdrop-blur-md text-foreground hover:border-primary/60 hover:bg-gaming-card hover:shadow-neon hover:scale-[1.02] active:scale-[0.98] hover:text-primary transition-all duration-300",
        secondary:
          "bg-gradient-to-r from-secondary to-accent text-secondary-foreground font-semibold hover:shadow-glow-secondary hover:scale-[1.02] active:scale-[0.98] border border-secondary/20",
        ghost: "text-foreground hover:bg-gaming-card/60 hover:text-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors duration-300",
        hero: "bg-gradient-electric text-white font-bold tracking-wide hover:shadow-electric hover:scale-105 active:scale-95 border border-primary/30 text-lg",
        gaming: "bg-gaming-card border-2 border-gaming-border text-foreground hover:border-primary/60 hover:bg-gaming-card/90 hover:shadow-neon hover:scale-[1.02] active:scale-[0.98]",
        neon: "bg-transparent border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]",
        cyber: "bg-gradient-gaming border border-primary/30 text-foreground hover:border-primary hover:shadow-glow-cyber hover:scale-[1.02] active:scale-[0.98]",
        success: "bg-gradient-to-r from-neon-green to-neon-green/80 text-white font-semibold hover:shadow-[0_0_25px_hsl(var(--neon-green)/0.4)] hover:scale-[1.02] active:scale-[0.98]",
        warning: "bg-gradient-to-r from-neon-gold to-neon-gold/80 text-white font-semibold hover:shadow-glow-golden hover:scale-[1.02] active:scale-[0.98]",
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
