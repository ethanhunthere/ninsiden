"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const DEMO_TEXT = "How does backpropagation work?";
const TOKENS = [
  { text: "How", color: "#00d4ff" },
  { text: "does", color: "#8b5cf6" },
  { text: "back", color: "#00d4ff" },
  { text: "prop", color: "#8b5cf6" },
  { text: "agation", color: "#00d4ff" },
  { text: "work", color: "#10b981" },
  { text: "?", color: "#64748b" },
];

export function TokenFlowVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (TOKENS.length + 2)), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl bg-panel border border-panel-border p-5">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-4">Token Flow</p>

      {/* Source text */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-white/3 border border-white/6">
        <p className="text-xs text-foreground/70 font-mono">&quot;{DEMO_TEXT}&quot;</p>
      </div>

      {/* Tokens */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {TOKENS.slice(0, Math.max(0, step)).map((tok, i) => (
            <motion.span
              key={`${tok.text}-${i}`}
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold border"
              style={{
                color: tok.color,
                borderColor: tok.color + "40",
                backgroundColor: tok.color + "10",
              }}
            >
              {tok.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-muted mt-3">
        Demo tokeniser — real LLMs use BPE sub-word tokenisation
      </p>
    </div>
  );
}
