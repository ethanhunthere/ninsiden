"use client";

import { EXAMPLE_PROMPTS } from "@/lib/constants/examples";
import { cn } from "@/lib/utils";

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function ExamplePrompts({ onSelect, disabled }: ExamplePromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_PROMPTS.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          disabled={disabled}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-150",
            "bg-white/3 text-foreground/60 border-panel-border",
            "hover:text-accent-cyan hover:border-accent-cyan/30 hover:bg-accent-cyan/5",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
