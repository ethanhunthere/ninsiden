"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * LiveTracePreview — minimal, abstract live-pipeline card for the hero.
 *
 * Intentionally light on detail: just a session header, a stylised prompt
 * line, and 5 compact pipeline pills that animate one-at-a-time. The deep
 * trace UI lives on /lab — this is the homepage teaser only.
 */

const STEPS = [
  { idx: 1, label: "Tokenize",   meta: "54 tokens",     color: "#00e5ff" },
  { idx: 2, label: "Retrieve",   meta: "top-k 8",       color: "#00e5ff" },
  { idx: 3, label: "Context",    meta: "4.5k tokens",   color: "#9d7aff" },
  { idx: 4, label: "Generate",   meta: "GPT-4o",        color: "#9d7aff" },
  { idx: 5, label: "Stream",     meta: "live",          color: "#00e5a0" },
] as const;

export function LiveTracePreview() {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((s) => (s % STEPS.length) + 1);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-panel-border-bright"
      style={{
        background:
          "linear-gradient(160deg, rgba(12,18,32,0.96) 0%, rgba(6,10,20,0.98) 100%)",
        boxShadow:
          "0 40px 100px -20px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset, 0 0 60px rgba(157,122,255,0.08)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-panel-border bg-[rgba(8,13,22,0.6)]">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="text-[11px] font-mono text-foreground-dim">
          live trace
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent-green/15 text-accent-green border border-accent-green/30">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Prompt line — abstract */}
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-violet/15 border border-accent-violet/30 shrink-0">
            <Sparkles size={13} className="text-accent-violet" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-accent-violet uppercase mb-1.5">
              Prompt
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "explain",
                "how",
                "transformers",
                "predict",
                "the",
                "next",
                "token",
              ].map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[12px] font-mono bg-[rgba(8,13,22,0.7)] border border-panel-border text-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical pipeline — minimal pills */}
        <div className="relative pl-5">
          <div
            className="absolute left-1.5 top-2 bottom-2 w-px"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,229,255,0.4), rgba(157,122,255,0.4), rgba(0,229,160,0.4))",
            }}
          />
          <div className="space-y-1.5">
            {STEPS.map((s) => {
              const isActive = s.idx === active;
              const isDone = s.idx < active;
              return (
                <div key={s.idx} className="relative">
                  <span
                    className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-300"
                    style={{
                      borderColor: isActive || isDone ? s.color : "var(--panel-border)",
                      background: isActive
                        ? s.color
                        : isDone
                        ? s.color + "55"
                        : "var(--background)",
                      boxShadow: isActive ? `0 0 12px ${s.color}` : "none",
                    }}
                  />
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-all duration-300"
                    style={{
                      borderColor: isActive
                        ? s.color + "55"
                        : "var(--panel-border)",
                      background: isActive
                        ? `linear-gradient(90deg, ${s.color}10 0%, transparent 100%)`
                        : "rgba(8,13,22,0.45)",
                    }}
                  >
                    <span
                      className="text-[12px] font-medium"
                      style={{
                        color: isActive ? "var(--foreground)" : "var(--foreground-dim)",
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: isActive ? s.color : "var(--muted)" }}
                    >
                      {s.meta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer disclaimer — short */}
      <div className="border-t border-panel-border px-4 py-2.5 bg-[rgba(6,10,18,0.7)]">
        <p className="text-[10px] text-muted text-center leading-relaxed">
          What the model uses — not how it secretly thinks.
        </p>
      </div>
    </div>
  );
}
