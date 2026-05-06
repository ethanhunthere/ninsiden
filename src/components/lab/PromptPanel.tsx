"use client";

import { useRef, useState } from "react";
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
      <div>
        <h2 className="text-sm font-semibold text-foreground/80">Prompt</h2>
        <p className="text-[11px] text-muted mt-0.5">⌘+Enter to run</p>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={status === "running"}
          placeholder="Type a prompt — e.g. Explain how neural networks learn."
          rows={5}
          className={cn(
            "w-full resize-none rounded-xl p-3 text-sm leading-relaxed",
            "bg-panel border border-panel-border text-foreground",
            "placeholder:text-muted/50 focus:outline-none",
            "transition-colors duration-150",
            status === "running"
              ? "opacity-70 cursor-not-allowed"
              : "focus:border-accent-cyan/40 focus:shadow-[0_0_0_1px_rgba(0,212,255,0.15)]"
          )}
        />
        {prompt.length > 0 && (
          <span className="absolute bottom-2.5 right-3 text-[10px] text-muted pointer-events-none">
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

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-[11px]">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "idle" && "bg-muted",
            status === "running" && "bg-accent-cyan animate-pulse",
            status === "completed" && "bg-accent-green",
            status === "error" && "bg-red-400"
          )}
        />
        <span className="text-muted capitalize">
          {status === "idle" ? "Ready" : status}
          {intent && status !== "idle" && ` · ${intent.replace(/_/g, " ")}`}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-panel-border" />

      {/* Example prompts */}
      <div>
        <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">
          Example prompts
        </p>
        <ExamplePrompts
          onSelect={onChange}
          disabled={status === "running"}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-auto p-3 rounded-lg bg-white/2 border border-white/6">
        <p className="text-[10px] text-muted/70 leading-relaxed">
          NInsideN visualises the <strong className="text-muted">observable application-level pipeline</strong> —
          prompt processing, retrieval, context assembly, and streaming response.
          It does not expose private hidden model reasoning or chain-of-thought.
        </p>
      </div>
    </div>
  );
}
