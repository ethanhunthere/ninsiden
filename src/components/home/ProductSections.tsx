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
    <section className="pt-48 lg:pt-64 pb-32 lg:pb-40 border-t border-panel-border relative overflow-hidden">
      {/* Deep ambient radial glow behind section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(0,229,255,0.03) 0%, transparent 65%)",
            "radial-gradient(ellipse 700px 400px at 20% 60%, rgba(157,122,255,0.04) 0%, transparent 60%)",
            "radial-gradient(ellipse 600px 400px at 80% 70%, rgba(0,229,160,0.03) 0%, transparent 60%)",
          ].join(", "),
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-xs font-medium tracking-[0.22em] uppercase text-muted mb-5">
            Why NInsideN
          </p>
          <h2
            className="font-bold text-gradient tracking-tight leading-tight mb-5"
            style={{ fontSize: "var(--text-display)" }}
          >
            AI made observable.
          </h2>
          <p className="text-foreground-dim text-base max-w-md mx-auto leading-relaxed">
            Every answer you get from an AI model is the result of a
            pipeline. We show you each step — live.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.id}
              className="neural-panel p-8 flex flex-col gap-5 group hover:border-panel-border-bright transition-all duration-300 relative overflow-hidden"
              style={{ "--card-accent": sec.accent } as React.CSSProperties}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -4 }}
            >
              {/* Background accent glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 200px 150px at 0% 0%, ${sec.accent}12 0%, transparent 70%)`,
                }}
              />

              {/* Step number — very large watermark */}
              <span
                className="text-[4.5rem] font-black leading-none font-mono select-none"
                style={{ color: sec.accent, opacity: 0.12 }}
              >
                {sec.step}
              </span>

              {/* Accent line */}
              <div className="w-10 h-[2px] rounded-full" style={{ background: sec.accent, opacity: 0.6 }} />

              {/* Heading */}
              <h3 className="text-lg font-semibold text-foreground leading-snug">
                {sec.heading}
              </h3>

              {/* Body */}
              <p className="text-sm text-foreground-dim leading-relaxed flex-1">
                {sec.body}
              </p>

              {/* Bottom accent sweep */}
              <div
                className="h-[1px] w-0 group-hover:w-full transition-all duration-600"
                style={{ background: `linear-gradient(90deg, ${sec.accent}60, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

