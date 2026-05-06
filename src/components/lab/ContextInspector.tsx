"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ChunkItem, ContextInfo } from "@/lib/trace/types";

interface ContextInspectorProps {
  chunks: ChunkItem[];
  contextInfo: ContextInfo | null;
}

export function ContextInspector({ chunks, contextInfo }: ContextInspectorProps) {
  if (chunks.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted">
        Context chunks will appear here after retrieval.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-full p-3 space-y-3">
      {contextInfo && (
        <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-accent-violet/5 border border-accent-violet/15 text-[11px]">
          <span className="text-muted">Chunks:</span>
          <span className="text-accent-violet font-semibold">{contextInfo.chunk_count}</span>
          <span className="text-muted">Est. tokens:</span>
          <span className="text-accent-violet font-semibold">~{contextInfo.token_estimate}</span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {chunks.map((chunk, i) => (
          <motion.div
            key={chunk.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel p-3 border border-accent-violet/15"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-foreground/80 truncate">{chunk.title}</span>
              <span className="text-[10px] text-accent-violet font-mono shrink-0">
                {(chunk.relevance * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[11px] text-foreground/50 leading-relaxed line-clamp-4">{chunk.snippet}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
