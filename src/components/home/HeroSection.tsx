"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical, Zap } from "lucide-react";
import { HeroNetworkVisual } from "./HeroNetworkVisual";

const FEATURES = [
  { label: "Observable pipeline", color: "var(--accent-cyan)" },
  { label: "Live SSE streaming", color: "var(--accent-violet)" },
  { label: "Token-level trace", color: "var(--accent-green)" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] flex items-center overflow-hidden">
      {/* Deep grid background */}
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />

      {/* Ambient radial glows */}
      <div
        className="absolute top-[-10%] left-[15%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.055) 0%, transparent 65%)" }}
        aria-hidden
      />
      <div
        className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(157,122,255,0.05) 0%, transparent 65%)" }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-6 py-20 w-full grid lg:grid-cols-[1fr_1fr] gap-14 items-center relative z-10">
        {/* Left: copy */}
        <div className="flex flex-col gap-7">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium bg-accent-cyan/8 text-accent-cyan border border-accent-cyan/18">
              <span className="status-dot status-dot-live" />
              Neural Inside Network · Live
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <h1
              className="font-bold tracking-tight leading-[1.05] text-gradient"
              style={{ fontSize: "var(--text-hero)" }}
            >
              See AI From<br />The Inside.
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            className="text-lg text-foreground-dim leading-relaxed max-w-[480px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
          >
            NInsideN renders every step of your AI prompt — tokenisation, intent, retrieval, context building, and streaming response — as a live visual pipeline.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30
                         hover:bg-accent-cyan/18 hover:border-accent-cyan/55 hover:shadow-glow-sm-cyan
                         transition-all duration-200"
            >
              <FlaskConical size={15} />
              Open Visual Lab
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/inside"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         bg-white/4 text-foreground-dim border border-panel-border
                         hover:text-foreground hover:border-panel-border-bright
                         transition-all duration-200"
            >
              How It Works
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap gap-3 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 text-xs text-muted"
              >
                <Zap
                  size={10}
                  style={{ color: f.color }}
                  className="flex-shrink-0"
                />
                {f.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right: neural network visual */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border border-panel-border"
          style={{
            height: "clamp(280px, 42vw, 420px)",
            background: "linear-gradient(145deg, rgba(8,13,22,0.95), rgba(4,5,10,0.98))",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.025) inset",
          }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />

          {/* Top chrome bar */}
          <div className="absolute top-0 left-0 right-0 h-8 border-b border-panel-border flex items-center px-3 gap-1.5 z-10"
               style={{ background: "rgba(8,13,22,0.9)" }}>
            {["#ff5f57","#febc2e","#28c840"].map((c) => (
              <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
            ))}
            <span className="ml-2 text-[10px] text-muted font-mono">observable-pipeline.live</span>
          </div>

          <div className="pt-8 w-full h-full">
            <HeroNetworkVisual />
          </div>

          {/* Bottom label */}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-[9px] text-muted/60 tracking-wider uppercase">
              Application-level AI pipeline visualisation
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

