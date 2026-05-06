"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Eye, Layers, ShieldCheck } from "lucide-react";
import { HeroNeuronCell } from "./HeroNeuronCell";
import { LiveTracePreview } from "./LiveTracePreview";

const FEATURE_BULLETS = [
  { Icon: Eye,         label: "Prompt-to-answer transparency" },
  { Icon: Layers,      label: "Source-level visibility" },
  { Icon: ShieldCheck, label: "Model-agnostic insights" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[96vh] flex flex-col justify-center">
      {/* Hero neuron — takes up the entire left half dramatically */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-y-0 left-0 w-[68%] hidden lg:block">
          <HeroNeuronCell />
        </div>
        {/* Mobile: centred top neuron */}
        <div className="absolute inset-x-0 top-0 h-[280px] lg:hidden opacity-40">
          <HeroNeuronCell />
        </div>
        {/* Gradient fade from neuron to right-side content */}
        <div
          className="absolute inset-y-0 left-0 w-full hidden lg:block"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(4,5,10,0.35) 52%, rgba(4,5,10,0.85) 68%, rgba(4,5,10,0.98) 80%)",
          }}
        />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-5 lg:px-10 pt-20 lg:pt-24 pb-20 lg:pb-28 w-full">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 xl:gap-16 items-center">
          {/* ── Left: Hero copy ──────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:gap-7 max-w-xl relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[11px] font-semibold tracking-[0.25em] uppercase text-accent-cyan"
            >
              AI Command Center
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-bold tracking-tight leading-[0.96] text-foreground"
              style={{ fontSize: "clamp(2.8rem, 5.8vw, 5.4rem)" }}
            >
              Neural Inside
              <br />
              Network
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-semibold leading-[1.1] tracking-tight"
              style={{
                fontSize: "clamp(1.5rem, 2.8vw, 2.5rem)",
                background:
                  "linear-gradient(105deg, #cdb4ff 0%, #9d7aff 55%, #00e5ff 115%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              See how AI answers
              <br />
              are assembled.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base text-foreground-dim leading-relaxed max-w-[480px]"
            >
              NInsideN.com shows the real, observable journey from your prompt
              to the final answer.{" "}
              <span className="text-foreground font-medium">No secrets.</span>{" "}
              <span className="text-foreground font-medium">Just clarity.</span>
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-2"
            >
              {FEATURE_BULLETS.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-foreground-dim">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/25">
                    <Icon size={13} className="text-accent-cyan" />
                  </span>
                  {label}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link
                href="/lab"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white border transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, #7c5ccc 0%, #9d7aff 100%)",
                  borderColor: "rgba(157,122,255,0.6)",
                  boxShadow:
                    "0 8px 30px rgba(157,122,255,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset",
                }}
              >
                Explore a Live Example
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/inside"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-foreground-dim hover:text-foreground transition-colors"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center border border-panel-border-bright bg-[rgba(8,13,22,0.7)]">
                  <Play size={11} className="text-accent-cyan ml-0.5" fill="currentColor" />
                </span>
                See How It Works
              </Link>
            </motion.div>

            {/* Trust panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="mt-2 inline-flex items-center gap-3 rounded-xl border border-panel-border bg-[rgba(8,13,22,0.55)] backdrop-blur-md px-3.5 py-2.5 max-w-fit"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-foreground/5 border border-panel-border">
                <ShieldCheck size={14} className="text-foreground-dim" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-semibold text-foreground">
                  We show what AI uses.
                </span>
                <span className="text-[11px] text-muted">
                  Not how it thinks.{" "}
                  <Link
                    href="/inside"
                    className="text-accent-cyan/80 hover:text-accent-cyan"
                  >
                    Learn more
                  </Link>
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── Right: Live trace preview ────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative"
          >
            <LiveTracePreview />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        aria-hidden
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-muted/60 to-transparent" />
      </motion.div>
    </section>
  );
}
