"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical } from "lucide-react";
import { BRAND } from "@/lib/constants/brand";
import { HeroNetworkVisual } from "./HeroNetworkVisual";
import { Glow } from "@/components/ui/Glow";

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] grid-bg flex items-center overflow-hidden">
      {/* Background glows */}
      <Glow color="cyan" size="lg" className="absolute top-20 left-1/4 -translate-x-1/2" />
      <Glow color="violet" size="lg" className="absolute bottom-20 right-1/4 translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-6 py-16 w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 mb-4">
              Neural Inside Network · v1
            </span>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              <span className="text-gradient">{BRAND.tagline}</span>
            </h1>
          </motion.div>

          <motion.p
            className="text-lg text-foreground/60 leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {BRAND.description}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40
                         hover:bg-accent-cyan/20 hover:border-accent-cyan/70 hover:shadow-glow-cyan
                         transition-all duration-200"
            >
              <FlaskConical size={16} />
              Open Visual Trace Lab
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/inside"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         bg-white/5 text-foreground/70 border border-panel-border
                         hover:text-foreground hover:border-foreground/30
                         transition-all duration-200"
            >
              Learn How It Works
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-4 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {["Observable pipeline", "Real SSE streaming", "OpenRouter AI"].map((feat) => (
              <span key={feat} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-1 h-1 rounded-full bg-accent-green" />
                {feat}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right: visual */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border border-panel-border bg-panel/50 h-[340px] lg:h-[380px]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="absolute inset-0 grid-bg opacity-40" />
          <HeroNetworkVisual />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-[10px] text-muted text-center">
              Observable application-level AI pipeline visualisation
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
