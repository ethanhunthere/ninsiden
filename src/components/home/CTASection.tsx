"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical, Zap } from "lucide-react";

const PROOF_ITEMS = [
  { label: "5 pipeline stages exposed" },
  { label: "Real-time SSE streaming" },
  { label: "Token-level transparency" },
];

export function CTASection() {
  return (
    <section className="py-40 lg:py-52 border-t border-panel-border relative overflow-hidden">
      {/* Multi-layer ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 700px 500px at 50% 50%, rgba(157,122,255,0.07) 0%, transparent 65%)",
              "radial-gradient(ellipse 400px 300px at 30% 40%, rgba(0,229,255,0.05) 0%, transparent 60%)",
              "radial-gradient(ellipse 400px 300px at 70% 65%, rgba(0,229,160,0.04) 0%, transparent 60%)",
            ].join(", "),
          }}
        />
        {/* Faint horizontal scan lines */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 4px)",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent-violet/60" />
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-accent-violet">
              Get Started
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent-violet/60" />
          </div>

          {/* Headline */}
          <h2
            className="font-black tracking-tight leading-[0.93] mb-6"
            style={{
              fontSize: "clamp(3rem, 7vw, 6rem)",
              background: "linear-gradient(120deg, #f0e6ff 0%, #c8aaff 35%, #9d7aff 60%, #00e5ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Enter
            <br />
            the Lab.
          </h2>

          <p className="text-foreground-dim text-lg max-w-lg mx-auto mb-5 leading-relaxed">
            Type a prompt. Watch every step — tokenised, retrieved,
            contextualised, and streamed — live.
          </p>

          {/* Mini proof points */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {PROOF_ITEMS.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted border border-panel-border bg-[rgba(8,13,22,0.6)]"
              >
                <Zap size={10} className="text-accent-cyan opacity-60" />
                {item.label}
              </span>
            ))}
          </div>

          {/* CTA button */}
          <Link
            href="/lab"
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #5a3db0 0%, #9d7aff 50%, #00e5ff 130%)",
              backgroundSize: "200% 100%",
              boxShadow: "0 0 0 1px rgba(157,122,255,0.5), 0 12px 40px rgba(157,122,255,0.4), 0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            <FlaskConical size={18} className="opacity-90" />
            Open Visual Trace Lab
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Subtext */}
          <p className="mt-6 text-[12px] text-muted">
            Free to explore. No account required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
