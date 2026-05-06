"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import type { SourceItem } from "@/lib/trace/types";

interface SourceInspectorProps {
  sources: SourceItem[];
}

export function SourceInspector({ sources }: SourceInspectorProps) {
  if (sources.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted">
        Sources will appear here when the retrieval layer runs.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-full p-3 space-y-3">
      <AnimatePresence initial={false}>
        {sources.map((source, i) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-3 border border-accent-green/15"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-foreground/90 leading-tight">{source.title}</p>
              <span className="text-[10px] font-mono text-accent-green shrink-0">
                {(source.relevance * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[11px] text-foreground/50 leading-relaxed mb-2 line-clamp-3">
              {source.snippet}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="muted">{source.type.replace(/_/g, " ")}</Badge>
              <Badge variant="green">demo</Badge>
            </div>
            {source.label && (
              <p className="text-[10px] text-muted/60 mt-1.5 italic">{source.label}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
