"use client";

import { motion } from "framer-motion";

const STEPS = [
  { icon: "📥", label: "Prompt", color: "#00d4ff" },
  { icon: "🔤", label: "Tokens", color: "#8b5cf6" },
  { icon: "🎯", label: "Intent", color: "#8b5cf6" },
  { icon: "🔍", label: "Retrieval", color: "#00d4ff" },
  { icon: "🏗️", label: "Context", color: "#8b5cf6" },
  { icon: "🚀", label: "Model", color: "#8b5cf6" },
  { icon: "◈", label: "Streaming", color: "#10b981" },
  { icon: "💡", label: "Answer", color: "#10b981" },
];

export function PipelinePreview() {
  return (
    <section className="py-20 border-t border-panel-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">
            <span className="text-gradient">Prompt to Answer</span>
          </h2>
          <p className="text-foreground/50 text-sm max-w-lg mx-auto">
            Every step of the observable AI pipeline — visualised, labelled, and traceable in real time.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-0">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <div
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border bg-panel"
                style={{ borderColor: step.color + "40" }}
              >
                <span className="text-xl">{step.icon}</span>
                <span className="text-[11px] font-medium" style={{ color: step.color }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <motion.div
                  className="hidden lg:flex items-center"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                  <svg width="28" height="8" viewBox="0 0 28 8" fill="none">
                    <line x1="0" y1="4" x2="20" y2="4" stroke="#1e2230" strokeWidth="1.5" />
                    <polygon points="18,1 26,4 18,7" fill="#1e2230" />
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
