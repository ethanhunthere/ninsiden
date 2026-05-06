"use client";

import { motion } from "framer-motion";

const SECTIONS = [
  { label: "System Prompt", tokens: 120, color: "#8b5cf6", pct: 12 },
  { label: "Context Chunks", tokens: 480, color: "#00d4ff", pct: 48 },
  { label: "User Prompt", tokens: 40, color: "#10b981", pct: 10 },
  { label: "Available", tokens: 360, color: "#1e2230", pct: 30 },
];

const TOTAL = 1000;

export function ContextWindowVisual() {
  return (
    <div className="rounded-xl bg-panel border border-panel-border p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-muted uppercase tracking-wider">Context Window</p>
        <span className="text-[10px] text-muted font-mono">~{TOTAL} tokens demo</span>
      </div>

      {/* Bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
        {SECTIONS.map((sec, i) => (
          <motion.div
            key={sec.label}
            initial={{ width: 0 }}
            animate={{ width: `${sec.pct}%` }}
            transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-sm"
            style={{ backgroundColor: sec.color }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {SECTIONS.map((sec) => (
          <div key={sec.label} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: sec.color }}
              />
              <span className="text-foreground/60">{sec.label}</span>
            </div>
            <span className="text-muted font-mono">{sec.tokens} tk</span>
          </div>
        ))}
      </div>
    </div>
  );
}
