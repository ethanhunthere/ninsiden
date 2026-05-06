"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  User,
  ChevronDown,
  ExternalLink,
  Info,
  FileText,
} from "lucide-react";

/**
 * LiveTracePreview — homepage "live session" mockup.
 *
 * Visually matches the structure of a real NInsideN trace session:
 * session header, user prompt, numbered pipeline steps, side rails
 * for sources and timeline, honest disclaimer footer.
 *
 * Uses scripted local state to feel alive without network calls
 * (the homepage hero must render instantly and reliably). Real
 * traces happen on /lab.
 */

const PIPELINE = [
  { idx: 1, label: "Tokenization",     meta: "54 tokens" },
  { idx: 2, label: "Retrieval / Search", meta: "Top-k: 8" },
  { idx: 3, label: "Context Building",   meta: "8 chunks · 4,512 tokens" },
  { idx: 4, label: "Model Response",     meta: "GPT-4o" },
  { idx: 5, label: "Answer Stream",      meta: "LIVE" },
] as const;

const SOURCES = [
  { title: "EMPEROR-Reduced Trial", meta: "Packer M, et al. · NEJM · 2020", tag: "Clinical Trial", relevance: 92 },
  { title: "DAPA-HF Trial",         meta: "McMurray JJV, et al. · NEJM · 2019", tag: "Clinical Trial", relevance: 91 },
  { title: "SGLT2 Inhibitors in HF: Mechanisms", meta: "Verma S, et al. · Circulation · 2021", tag: "Review", relevance: 89 },
  { title: "ESC Guidelines for Heart Failure", meta: "McDonagh TA, et al. · 2021", tag: "Guideline", relevance: 87 },
] as const;

const TIMELINE: ReadonlyArray<{ time: string; label: string; meta?: string; live?: boolean }> = [
  { time: "10:42:13", label: "Prompt received" },
  { time: "10:42:13", label: "Tokenization completed", meta: "54 tokens" },
  { time: "10:42:14", label: "Retrieval search completed", meta: "6 sources" },
  { time: "10:42:15", label: "Context built", meta: "8 chunks · 4,512 tokens" },
  { time: "10:42:16", label: "Model response started" },
  { time: "10:42:16", label: "Answer streaming", live: true },
];

const TOKEN_PREVIEW = ["What", "are", "the", "clinical", "effects", "and", "mechanisms"];

const ANSWER_TEXT =
  "SGLT2 inhibitors reduce the risk of heart failure hospitalization and cardiovascular death in patients with heart failure, regardless of diabetes status. Their benefits are thought to arise from multiple mechanisms, including natriuresis and osmotic diuresis leading to reduced preload, lower blood pressure, decreased arterial stiffness, improved myocardial metabolism and energetics, and reduced inflammation and fibrosis…";

export function LiveTracePreview() {
  const [activeStep, setActiveStep] = useState(5);
  const [streamLen, setStreamLen] = useState(0);

  useEffect(() => {
    // Slow cycle through steps for life
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s % 5) + 1);
    }, 4200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    // Typewriter for answer block when on step 5
    if (activeStep !== 5) {
      setStreamLen(ANSWER_TEXT.length);
      return;
    }
    setStreamLen(0);
    const t = setInterval(() => {
      setStreamLen((n) => {
        if (n >= ANSWER_TEXT.length) {
          clearInterval(t);
          return n;
        }
        return n + 6;
      });
    }, 28);
    return () => clearInterval(t);
  }, [activeStep]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-panel-border-bright"
      style={{
        background:
          "linear-gradient(160deg, rgba(12,18,32,0.96) 0%, rgba(6,10,20,0.98) 100%)",
        boxShadow:
          "0 40px 100px -20px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset, 0 0 60px rgba(157,122,255,0.06)",
      }}
    >
      {/* ── Top bar: session meta ────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-panel-border bg-[rgba(8,13,22,0.6)]">
        <span className="text-[11px] font-mono text-foreground-dim">
          SESSION{" "}
          <span className="text-foreground">7f3a9c2e</span>
        </span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent-green/15 text-accent-green border border-accent-green/30">
          LIVE
        </span>
        <div className="flex-1" />
        <span className="text-[11px] text-muted">
          Model: <span className="text-foreground-dim font-mono">GPT-4o</span>
        </span>
        <span className="text-[11px] text-muted hidden sm:inline">Today, 10:42 AM</span>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-foreground-dim border border-panel-border hover:border-panel-border-bright hover:text-foreground transition-colors"
        >
          <Share2 size={11} />
          Share
        </button>
      </div>

      {/* ── Body grid ────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_220px] gap-0">
        {/* Left main column */}
        <div className="p-4 space-y-3">
          {/* User prompt */}
          <div className="rounded-xl border border-panel-border bg-[rgba(8,13,22,0.5)] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-accent-violet/15 border border-accent-violet/30">
                <User size={11} className="text-accent-violet" />
              </span>
              <span className="text-[10px] font-semibold tracking-[0.15em] text-accent-violet uppercase">
                User Prompt
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              What are the clinical effects and mechanisms of action of SGLT2
              inhibitors in heart failure?
            </p>
          </div>

          {/* Numbered pipeline */}
          <div className="relative pl-7">
            {/* Vertical timeline rail */}
            <div
              className="absolute left-2 top-3 bottom-3 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,229,255,0.35), rgba(157,122,255,0.35), rgba(0,229,160,0.35))",
              }}
            />

            <div className="space-y-2.5">
              {PIPELINE.map((step) => {
                const isActive = step.idx === activeStep;
                const isDone = step.idx < activeStep;
                const accent =
                  step.idx <= 2
                    ? "#00e5ff"
                    : step.idx <= 4
                    ? "#9d7aff"
                    : "#00e5a0";
                return (
                  <div key={step.idx} className="relative">
                    {/* Numbered dot */}
                    <span
                      className="absolute -left-[26px] top-3 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-300"
                      style={{
                        background: isActive
                          ? accent + "22"
                          : isDone
                          ? accent + "11"
                          : "rgba(8,13,22,1)",
                        borderColor: isActive
                          ? accent
                          : isDone
                          ? accent + "60"
                          : "var(--panel-border)",
                        color: isActive || isDone ? accent : "var(--muted)",
                        boxShadow: isActive ? `0 0 12px ${accent}80` : "none",
                      }}
                    >
                      {step.idx}
                    </span>

                    <div
                      className={`rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
                        isActive ? "shadow-glow-sm-cyan" : ""
                      }`}
                      style={{
                        borderColor: isActive
                          ? accent + "55"
                          : "var(--panel-border)",
                        background: isActive
                          ? `linear-gradient(180deg, ${accent}0c 0%, transparent 100%)`
                          : "rgba(8,13,22,0.45)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="text-[9px] font-mono opacity-60"
                            style={{ color: accent }}
                          >
                            {String(step.idx).padStart(2, "0")}
                          </span>
                          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foreground">
                            {step.label}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: isActive ? accent : "var(--muted)" }}
                        >
                          {step.meta}
                        </span>
                      </div>

                      {/* Step-specific contents */}
                      {step.idx === 1 && (
                        <div className="mt-2.5">
                          <div className="flex flex-wrap gap-1">
                            {TOKEN_PREVIEW.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-panel border border-panel-border text-foreground-dim"
                              >
                                {t}
                              </span>
                            ))}
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted">
                              …
                            </span>
                          </div>
                          <button className="text-[10px] text-accent-cyan/80 hover:text-accent-cyan mt-2 flex items-center gap-1">
                            View tokens <ChevronDown size={10} />
                          </button>
                        </div>
                      )}

                      {step.idx === 2 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] text-muted mb-1.5">Search across 6 sources</p>
                          <div className="flex items-center gap-1.5">
                            {[
                              "#1f6feb",
                              "#9d7aff",
                              "#00e5ff",
                              "#f87171",
                              "#a371f7",
                              "#00e5a0",
                            ].map((c, i) => (
                              <span
                                key={i}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white border"
                                style={{
                                  background: c + "22",
                                  borderColor: c + "55",
                                  color: c,
                                }}
                              >
                                {String.fromCharCode(65 + i)}
                              </span>
                            ))}
                            <span className="text-[10px] text-muted ml-1">+2</span>
                            {isActive && (
                              <span className="ml-auto text-[10px] text-accent-cyan animate-pulse">
                                Searching…
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {step.idx === 3 && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted w-24 shrink-0">
                              System Instructions
                            </span>
                            <div className="flex-1 flex gap-px h-3">
                              {Array.from({ length: 24 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="flex-1"
                                  style={{
                                    background:
                                      i < 8
                                        ? "rgba(0,229,255,0.55)"
                                        : i < 18
                                        ? "rgba(157,122,255,0.55)"
                                        : "rgba(157,122,255,0.35)",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted w-24 shrink-0">
                              User Prompt
                            </span>
                            <div className="flex-1 flex gap-px h-3">
                              {Array.from({ length: 7 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="flex-1"
                                  style={{
                                    background: "rgba(0,229,255,0.35)",
                                  }}
                                />
                              ))}
                              {Array.from({ length: 17 }).map((_, i) => (
                                <span key={"e" + i} className="flex-1" />
                              ))}
                            </div>
                          </div>
                          <button className="text-[10px] text-accent-cyan/80 hover:text-accent-cyan mt-1 flex items-center gap-1">
                            View context <ChevronDown size={10} />
                          </button>
                        </div>
                      )}

                      {step.idx === 4 && isActive && (
                        <p className="mt-2 text-[10px] text-accent-violet animate-pulse">
                          Generating<span className="tracking-widest">···</span>
                        </p>
                      )}

                      {step.idx === 5 && (
                        <div className="mt-2.5">
                          <p className="text-[12px] text-foreground/85 leading-relaxed font-normal">
                            {ANSWER_TEXT.slice(0, streamLen)}
                            {streamLen < ANSWER_TEXT.length && isActive && (
                              <span className="inline-block w-0.5 h-3 bg-accent-green ml-0.5 animate-pulse" />
                            )}
                          </p>
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-panel-border">
                            <span className="text-[10px] text-muted">
                              Generated 186 tokens in 2.71s
                            </span>
                            <button className="text-[10px] text-accent-cyan/80 hover:text-accent-cyan flex items-center gap-1">
                              View Full Output <ExternalLink size={9} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right rail: Sources + Timeline */}
        <aside className="border-l border-panel-border p-3 space-y-3 bg-[rgba(6,10,18,0.5)]">
          {/* Sources */}
          <section>
            <header className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-foreground-dim">
                Sources <span className="text-muted font-normal">({SOURCES.length})</span>
              </h3>
              <button className="text-[10px] text-accent-cyan/80 hover:text-accent-cyan">
                View all
              </button>
            </header>
            <div className="space-y-1.5">
              {SOURCES.map((s) => (
                <div
                  key={s.title}
                  className="rounded-lg border border-panel-border bg-[rgba(8,13,22,0.7)] p-2 hover:border-panel-border-bright transition-colors"
                >
                  <div className="flex items-start gap-1.5">
                    <FileText size={10} className="text-foreground-dim mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-foreground truncate">
                        {s.title}
                      </p>
                      <p className="text-[9px] text-muted truncate mt-0.5">
                        {s.meta}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="px-1 py-px rounded text-[8px] font-mono bg-panel border border-panel-border text-foreground-dim">
                          {s.tag}
                        </span>
                        <span className="text-[9px] font-mono text-accent-green">
                          {s.relevance}% relevant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <header className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-foreground-dim">
                Timeline
              </h3>
              <button className="text-[10px] text-accent-cyan/80 hover:text-accent-cyan">
                View full
              </button>
            </header>
            <div className="space-y-1">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="font-mono text-muted w-14 shrink-0">{t.time}</span>
                  <span className="text-foreground-dim flex-1 truncate">
                    {t.label}
                  </span>
                  {t.live ? (
                    <span className="px-1 py-px rounded text-[8px] font-bold bg-accent-green/15 text-accent-green border border-accent-green/30">
                      LIVE
                    </span>
                  ) : t.meta ? (
                    <span className="font-mono text-muted truncate max-w-[80px]">
                      {t.meta}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* ── Disclaimer footer ────────────────────────────────── */}
      <div className="border-t border-panel-border px-4 py-2.5 bg-[rgba(6,10,18,0.7)] flex items-center gap-2">
        <Info size={11} className="text-accent-cyan shrink-0" />
        <p className="text-[10px] text-muted leading-relaxed flex-1">
          NInsideN shows the observable process: inputs, sources, context, and
          outputs. We do not show hidden reasoning or chain-of-thought.
        </p>
        <a
          href="/inside"
          className="text-[10px] text-accent-cyan/80 hover:text-accent-cyan whitespace-nowrap"
        >
          Learn more →
        </a>
      </div>
    </div>
  );
}
