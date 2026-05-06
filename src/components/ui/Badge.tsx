import { cn } from "@/lib/utils";

type BadgeVariant = "cyan" | "violet" | "green" | "muted" | "red";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  cyan: "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30",
  violet: "bg-accent-violet/10 text-accent-violet border border-accent-violet/30",
  green: "bg-accent-green/10 text-accent-green border border-accent-green/30",
  muted: "bg-white/5 text-muted border border-white/10",
  red: "bg-red-500/10 text-red-400 border border-red-500/20",
};

export function Badge({ variant = "muted", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
