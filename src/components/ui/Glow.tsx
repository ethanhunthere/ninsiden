import { cn } from "@/lib/utils";

interface GlowProps {
  color?: "cyan" | "violet" | "green";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorMap = {
  cyan: "bg-accent-cyan",
  violet: "bg-accent-violet",
  green: "bg-accent-green",
};

const sizeMap = {
  sm: "w-16 h-16 blur-xl",
  md: "w-32 h-32 blur-2xl",
  lg: "w-64 h-64 blur-3xl",
};

export function Glow({ color = "cyan", size = "md", className }: GlowProps) {
  return (
    <div
      className={cn(
        "rounded-full opacity-20 pointer-events-none select-none",
        colorMap[color],
        sizeMap[size],
        className
      )}
      aria-hidden
    />
  );
}
