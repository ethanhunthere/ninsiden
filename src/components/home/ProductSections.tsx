"use client";

import { motion } from "framer-motion";

const SECTIONS = [
  {
    id: "what",
    step: "01",
    heading: "A visual trace lab for AI pipelines",
    body: "NInsideN renders the observable, application-level AI pipeline — not hidden model weights — so you can watch every step from prompt input to token output.",
    color: "cyan",
    accent: "var(--accent-cyan)",
  },
  {
    id: "why",
    step: "02",
    heading: "Most AI hides the process",
    body: "Standard chatbots show a blinking cursor then a response. NInsideN reveals what happened: normalisation, tokenisation, retrieval, context building, and streaming — made transparent.",
    color: "violet",
    accent: "var(--accent-violet)",
  },
  {
    id: "who",
    step: "03",
    heading: "Built for learners and builders",
    body: "Beginners learn AI visually. Developers understand RAG and LLM architecture. Students see tokens, context windows, and model flow. Builders study how real AI products work.",
    color: "green",
    accent: "var(--accent-green)",
  },
];

export function ProductSections() {
  return (
    <section className="py-24 border-t border-panel-border relative overflow-hidden">
      {/* Section ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 800px 400px at 50% 100%, rgba(0,229,255,0.025) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted mb-4">
            Why NInsideN
          </p>
          <h2
            className="font-bold text-gradient tracking-tight leading-tight"
            style={{ fontSize: "var(--text-display)" }}
          >
            AI made observable.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              className="neural-panel p-7 flex flex-col gap-4 group hover:border-panel-border-bright transition-all duration-300"
              style={{ "--card-accent": sec.accent } as React.CSSProperties}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              whileHover={{ y: -3 }}
            >
              {/* Step number */}
              <span
                className="text-3xl font-bold leading-none opacity-25 font-mono"
                style={{ color: sec.accent }}
              >
                {sec.step}
              </span>

              {/* Divider */}
              <div className="w-8 h-px" style={{ background: sec.accent, opacity: 0.35 }} />

              {/* Heading */}
              <h3 className="text-base font-semibold text-foreground leading-snug">
                {sec.heading}
              </h3>

              {/* Body */}
              <p className="text-sm text-foreground-dim leading-relaxed flex-1">
                {sec.body}
              </p>

              {/* Bottom accent line */}
              <div
                className="h-px w-0 group-hover:w-full transition-all duration-500"
                style={{ background: `linear-gradient(90deg, ${sec.accent}50, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

