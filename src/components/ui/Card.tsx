import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "cyan" | "violet" | "green" | "none";
}

export function Card({ glow = "none", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass-panel p-4",
        glow === "cyan" && "glow-border",
        glow === "violet" && "glow-border-violet",
        glow === "green" && "glow-border-green",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
