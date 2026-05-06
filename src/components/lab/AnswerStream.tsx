"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <span className="text-xs font-medium text-muted uppercase tracking-wider">Answer</span>
        {status === "running" && (
          <span className="flex items-center gap-1.5 text-[10px] text-accent-green ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Streaming
          </span>
        )}
        {status === "completed" && (
          <span className="text-[10px] text-accent-green ml-auto">Complete</span>
        )}
        {modelInfo && (
          <span className="text-[10px] text-muted font-mono truncate max-w-[120px]">
            {modelInfo.model}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-3xl opacity-30">💡</span>
            <p className="text-xs text-muted max-w-[160px] leading-relaxed">
              Run a trace to see the AI response stream here.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {(status === "running" || status === "completed") && answer && (
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">
              {answer}
              {status === "running" && (
                <motion.span
                  className="inline-block w-1.5 h-4 bg-accent-cyan ml-0.5 align-middle rounded-sm"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </p>
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
            <span>{tokens.length} tokens</span>
            <span>{answer.length} chars</span>
            {modelInfo && !modelInfo.openrouter_configured && (
              <span className="text-accent-cyan/60">Local fallback mode</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
