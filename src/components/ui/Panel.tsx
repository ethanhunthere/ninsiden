import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Panel({ label, className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-panel border border-panel-border rounded-xl overflow-hidden",
        className
      )}
      {...props}
    >
      {label && (
        <div className="px-4 py-2 border-b border-panel-border">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
