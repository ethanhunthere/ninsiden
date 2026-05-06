"use client";

import { motion } from "framer-motion";

const STEPS = [
  { label: "Prompt",    abbr: "IN",  color: "#00e5ff", group: "input" },
  { label: "Tokens",    abbr: "TK",  color: "#9d7aff", group: "process" },
  { label: "Intent",   abbr: "IT",  color: "#9d7aff", group: "process" },
  { label: "Retrieval",abbr: "RT",  color: "#00e5ff", group: "process" },
  { label: "Context",  abbr: "CTX", color: "#9d7aff", group: "process" },
  { label: "Model",    abbr: "LM",  color: "#9d7aff", group: "model" },
  { label: "Stream",   abbr: "SS",  color: "#00e5a0", group: "output" },
  { label: "Answer",   abbr: "OUT", color: "#00e5a0", group: "output" },
];

export function PipelinePreview() {
  return (
    <section className="py-24 border-t border-panel-border relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted mb-4">Pipeline</p>
          <h2 className="text-3xl font-bold text-gradient">Prompt → Answer</h2>
          <p className="text-foreground-dim text-sm mt-3 max-w-md mx-auto">
            Every observable step — tokenised, classified, retrieved, contextualised, and streamed.
          </p>
        </motion.div>

        {/* Node row */}
        <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex items-center"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.065, duration: 0.4 }}
            >
              {/* Node */}
              <div className="flex flex-col items-center gap-2 px-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold font-mono border"
                  style={{
                    borderColor: step.color + "45",
                    background: `radial-gradient(circle at 35% 35%, #111d2e, #080d16)`,
                    boxShadow: `0 0 16px ${step.color}18`,
                    color: step.color,
                  }}
                >
                  {step.abbr}
                </div>
                <span className="text-[10px] text-muted whitespace-nowrap">{step.label}</span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <motion.div
                  className="flex items-center mx-0.5"
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.28 }}
                >
                  <svg width="24" height="6" viewBox="0 0 24 6" fill="none" aria-hidden>
                    <line x1="0" y1="3" x2="18" y2="3" stroke="#1e3054" strokeWidth="1.5" />
                    <polygon points="16,0.5 23,3 16,5.5" fill="#1e3054" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
