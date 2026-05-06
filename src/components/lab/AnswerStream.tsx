"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface AnswerStreamProps {
  tokens: string[];
  answer: string;
  status: "idle" | "running" | "completed" | "error";
  error: string | null;
  modelInfo: { model: string; openrouter_configured: boolean } | null;
}

export function AnswerStream({ tokens, answer, status, error, modelInfo }: AnswerStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "running") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [tokens.length, status]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-panel-border shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-glow-sm-green" />
        <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">Answer</span>
        {status === "running" && (
          <span className="flex items-center gap-1.5 text-[10px] text-accent-green ml-auto">
            <span className="status-dot status-dot-live" />
            Streaming
          </span>
        )}
        {status === "completed" && (
          <span className="flex items-center gap-1 text-[10px] text-accent-green ml-auto">
            <span className="status-dot status-dot-done" />
            Complete
          </span>
        )}
        {modelInfo && (
          <span className={cn("text-[10px] text-muted font-mono truncate max-w-[110px]", status === "idle" && "ml-auto")}>
            {modelInfo.model}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div
              className="w-12 h-12 rounded-full border border-panel-border flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(0,229,160,0.06), transparent)" }}
            >
              <span className="w-2 h-2 rounded-full bg-muted" />
            </div>
            <p className="text-xs text-muted max-w-[140px] leading-relaxed">
              Run a trace to see the AI response stream here.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {(status === "running" || status === "completed") && answer && (
          <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground-dim leading-relaxed">
            <ReactMarkdown>{answer}</ReactMarkdown>
            {status === "running" && (
              <motion.span
                className="inline-block w-[3px] h-[15px] bg-accent-cyan ml-0.5 align-middle rounded-sm"
                animate={{ opacity: [1, 0.1, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            )}
          </div>
        )}

        {status === "completed" && !answer && !error && (
          <p className="text-xs text-muted italic">No answer content received.</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      {status === "completed" && answer && (
        <div className="px-4 py-2 border-t border-panel-border shrink-0">
          <div className="flex items-center gap-4 text-[10px] text-muted">
            <span className="text-accent-green/80">{tokens.length} tokens</span>
            <span>{answer.length} chars</span>
            {modelInfo && !modelInfo.openrouter_configured && (
              <span className="text-accent-cyan/60">Fallback mode</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

