"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40 hover:bg-accent-cyan/20 hover:border-accent-cyan/70 hover:shadow-glow-cyan",
  secondary:
    "bg-accent-violet/10 text-accent-violet border border-accent-violet/40 hover:bg-accent-violet/20 hover:border-accent-violet/70 hover:shadow-glow-violet",
  ghost:
    "bg-transparent text-foreground/70 border border-panel-border hover:text-foreground hover:border-foreground/30",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400/60",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-200 cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
