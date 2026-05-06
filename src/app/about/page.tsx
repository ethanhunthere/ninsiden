import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About NInsideN",
  description: "NInsideN — Neural Inside Network. Making AI systems visible and understandable.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 60%)" }}
        aria-hidden
      />

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        <div className="mb-14">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted mb-5">About</p>
          <h1
            className="font-bold text-gradient mb-3 tracking-tight leading-tight"
            style={{ fontSize: "var(--text-display)" }}
          >
            NInsideN
          </h1>
          <p className="text-foreground-dim text-lg">Neural Inside Network</p>
        </div>

        <div className="space-y-6">
          {/* What it means */}
          <section className="neural-panel p-6 border-accent-cyan/15">
            <h2 className="text-sm font-semibold text-accent-cyan mb-3 uppercase tracking-[0.1em]">What NInsideN Means</h2>
            <p className="text-sm text-foreground-dim leading-relaxed mb-3">
              <strong className="text-foreground">NInsideN</strong> stands for{" "}
              <strong className="text-foreground">Neural Inside Network</strong>. The name
              captures the core mission: to make what happens inside an AI system
              visible, understandable, and interactive — without mystifying or overpromising.
            </p>
            <p className="text-sm text-foreground-dim leading-relaxed">
              Modern AI products are powerful, but the process is largely hidden. NInsideN makes
              the observable, application-level pipeline transparent.
            </p>
          </section>

          {/* Mission */}
          <section className="neural-panel p-6">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-[0.1em]">Mission</h2>
            <p className="text-sm text-foreground-dim leading-relaxed">
              Make AI systems visible, understandable, and interactive. Not through hype or
              magic claims — through honest, technically accurate visualisation of real
              application-level processes.
            </p>
          </section>

          {/* What we show */}
          <section className="neural-panel p-6 border-accent-violet/15">
            <h2 className="text-sm font-semibold text-accent-violet mb-4 uppercase tracking-[0.1em]">What NInsideN Shows</h2>
            <ul className="space-y-2">
              {[
                "How a prompt is received and normalised",
                "How text is split into tokens",
                "How intent is detected from the prompt",
                "How a retrieval query is generated",
                "How local demo knowledge is searched",
                "How context chunks are selected and assembled",
                "When and how the model request is made",
                "How tokens stream back from the model",
                "How the final answer is assembled",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground-dim">
                  <span className="text-accent-green mt-0.5 flex-shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* What we don't claim */}
          <section className="neural-panel p-6 border-accent-green/15">
            <h2 className="text-sm font-semibold text-accent-green mb-3 uppercase tracking-[0.1em]">What NInsideN Does Not Claim</h2>
            <p className="text-sm text-foreground-dim leading-relaxed mb-3">
              NInsideN does <strong className="text-foreground">not</strong> claim to expose
              private hidden AI reasoning, chain-of-thought, or internal model weights.
            </p>
            <p className="text-sm text-foreground-dim leading-relaxed">
              The model is a black box. NInsideN makes visible the{" "}
              <strong className="text-foreground">observable application pipeline</strong>{" "}
              that surrounds it: prompt processing, retrieval, context building, the model
              API request, and the streaming response.
            </p>
          </section>

          {/* Tech */}
          <section className="neural-panel p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-[0.1em]">Technology</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Frontend", val: "Next.js · TypeScript · Tailwind · Framer Motion" },
                { label: "Backend", val: "Python · FastAPI · SSE · OpenAI API" },
                { label: "AI API", val: "OpenAI-compatible chat completions streaming" },
                { label: "Deployment", val: "Vercel — ninsiden.com" },
              ].map((t) => (
                <div key={t.label} className="glass-panel p-3 rounded-lg">
                  <p className="text-[10px] text-muted uppercase tracking-[0.12em] mb-1">{t.label}</p>
                  <p className="text-xs text-foreground-dim">{t.val}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center pt-4">
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                         bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30
                         hover:bg-accent-cyan/18 hover:border-accent-cyan/55 hover:shadow-glow-sm-cyan
                         transition-all duration-200"
            >
              Open Visual Trace Lab
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
