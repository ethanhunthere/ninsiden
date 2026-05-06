"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 border-t border-panel-border">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Enter the Lab.</span>
          </h2>
          <p className="text-foreground/50 mb-8 text-lg">
            Type a prompt. Watch it become an answer — step by step, live.
          </p>
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold
                       bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40
                       hover:bg-accent-cyan/20 hover:border-accent-cyan/70 hover:shadow-glow-cyan
                       transition-all duration-200"
          >
            <FlaskConical size={18} />
            Open Visual Trace Lab
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
