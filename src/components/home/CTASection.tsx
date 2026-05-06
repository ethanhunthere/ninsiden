"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 border-t border-panel-border">
      <div className="max-w-3xl mx-auto px-6 text-center relative">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 -top-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 500px 300px at 50% 50%, rgba(0,229,255,0.05) 0%, transparent 70%)" }}
          aria-hidden
        />
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted mb-5">Get Started</p>
          <h2
            className="font-bold text-gradient mb-5 tracking-tight leading-tight"
            style={{ fontSize: "var(--text-display)" }}
          >
            Enter the Lab.
          </h2>
          <p className="text-foreground-dim mb-10 text-lg max-w-lg mx-auto">
            Type a prompt. Watch every step — tokenised, retrieved, contextualised, and streamed — live.
          </p>
          <Link
            href="/lab"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold
                       bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30
                       hover:bg-accent-cyan/18 hover:border-accent-cyan/55 hover:shadow-glow-cyan
                       transition-all duration-200"
          >
            <FlaskConical size={17} />
            Open Visual Trace Lab
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
