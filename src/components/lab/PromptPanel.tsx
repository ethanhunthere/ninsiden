"use client";

import { useRef } from "react";
import { ExamplePrompts } from "./ExamplePrompts";
import { RunControls } from "./RunControls";
import { cn } from "@/lib/utils";

interface PromptPanelProps {
  prompt: string;
  onChange: (value: string) => void;
  status: "idle" | "running" | "completed" | "error";
  onRun: () => void;
  onReset: () => void;
  intent: string | null;
}

export function PromptPanel({
  prompt,
  onChange,
  status,
  onRun,
  onReset,
  intent,
}: PromptPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (prompt.trim() && status !== "running") onRun();
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-glow-sm-cyan" />
        <h2 className="text-xs font-semibold text-foreground-dim uppercase tracking-[0.12em]">Prompt</h2>
        <span className="ml-auto text-[10px] text-muted">⌘+Enter to run</span>
      </div>

      {/* Textarea */}
      <div className="relative flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={status === "running"}
          placeholder="Type a prompt — e.g. Explain how neural networks learn."
          className={cn(
            "w-full h-full min-h-[120px] resize-none rounded-xl p-3.5 text-sm leading-relaxed",
            "bg-panel-raised border border-panel-border text-foreground",
            "placeholder:text-muted/40 focus:outline-none",
            "transition-colors duration-150",
            status === "running"
              ? "opacity-60 cursor-not-allowed"
              : "focus:border-accent-cyan/35 focus:shadow-[0_0_0_1px_rgba(0,229,255,0.1)]"
          )}
        />
        {prompt.length > 0 && (
          <span className="absolute bottom-2.5 right-3 text-[10px] text-muted/50 pointer-events-none">
            {prompt.length}/2000
          </span>
        )}
      </div>

      {/* Controls */}
      <RunControls
        status={status}
        onRun={onRun}
        onReset={onReset}
        canRun={prompt.trim().length > 0}
      />

      {/* Status */}
      <div className="flex items-center gap-2 text-[11px]">
        <span
          className={cn(
            "status-dot",
            status === "idle" && "bg-muted",
            status === "running" && "status-dot-live",
            status === "completed" && "status-dot-done",
            status === "error" && "status-dot-error"
          )}
        />
        <span className="text-muted capitalize">
          {status === "idle" ? "Ready" : status}
          {intent && status !== "idle" && ` · ${intent.replace(/_/g, " ")}`}
        </span>
      </div>

      <div className="border-t border-panel-border" />

      {/* Example prompts */}
      <div>
        <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2.5">
          Example prompts
        </p>
        <ExamplePrompts
          onSelect={onChange}
          disabled={status === "running"}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-auto p-3 rounded-lg bg-white/2 border border-panel-border">
        <p className="text-[10px] text-muted/60 leading-relaxed">
          NInsideN shows the <strong className="text-muted/80">observable application pipeline</strong> —
          prompt processing, retrieval, context, and streaming. Not private model internals.
        </p>
      </div>
    </div>
  );
}

