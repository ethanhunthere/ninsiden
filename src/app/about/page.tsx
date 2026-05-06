import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About NInsideN",
  description: "NInsideN — Neural Inside Network. Making AI systems visible and understandable.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">About NInsideN</span>
          </h1>
          <p className="text-foreground/50 text-lg">Neural Inside Network</p>
        </div>

        <div className="space-y-8">
          {/* Mission */}
          <section className="glass-panel p-6 border border-accent-cyan/15">
            <h2 className="text-lg font-bold text-accent-cyan mb-3">What NInsideN Means</h2>
            <p className="text-sm text-foreground/60 leading-relaxed mb-3">
              <strong className="text-foreground/80">NInsideN</strong> stands for{" "}
              <strong className="text-foreground/80">Neural Inside Network</strong>. The name
              captures the core mission: to make what happens inside an AI neural network
              system visible, understandable, and interactive — without mystifying or
              overpromising.
            </p>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Modern AI products are powerful, but the process that turns a user&apos;s prompt
              into an answer is largely hidden. NInsideN makes the observable, application-level
              pipeline transparent.
            </p>
          </section>

          {/* Mission */}
          <section>
            <h2 className="text-lg font-bold text-foreground/80 mb-3">Mission</h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Make AI systems visible, understandable, and interactive. Not through hype or
              magic claims — through honest, technically accurate visualisation of real
              application-level processes.
            </p>
          </section>

          {/* What we show */}
          <section className="glass-panel p-6 border border-accent-violet/15">
            <h2 className="text-lg font-bold text-accent-violet mb-3">What NInsideN Shows</h2>
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
                <li key={item} className="flex items-start gap-2 text-sm text-foreground/60">
                  <span className="text-accent-green mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* What we don't claim */}
          <section className="glass-panel p-6 border border-accent-green/15">
            <h2 className="text-lg font-bold text-accent-green mb-3">What NInsideN Does Not Claim</h2>
            <p className="text-sm text-foreground/60 leading-relaxed mb-3">
              NInsideN does <strong className="text-foreground/80">not</strong> claim to expose
              private hidden AI reasoning, chain-of-thought, or internal model weights.
            </p>
            <p className="text-sm text-foreground/60 leading-relaxed">
              The model itself is a black box. What NInsideN makes visible is the{" "}
              <strong className="text-foreground/80">transparent, observable application pipeline</strong>{" "}
              that surrounds the model: prompt processing, retrieval, context building, the model
              API request, and the streaming response. These are real, verifiable, application-level
              operations — not simulated internal model thinking.
            </p>
          </section>

          {/* Tech */}
          <section>
            <h2 className="text-lg font-bold text-foreground/80 mb-3">Technology</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Frontend", val: "Next.js 15 · TypeScript · Tailwind · Framer Motion" },
                { label: "Backend", val: "Python · FastAPI · SSE · OpenRouter" },
                { label: "AI API", val: "OpenRouter — OpenAI-compatible chat completions" },
                { label: "Deployment", val: "Vercel — ninsiden.com" },
              ].map((t) => (
                <div key={t.label} className="glass-panel p-3">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{t.label}</p>
                  <p className="text-xs text-foreground/70">{t.val}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center pt-4">
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                         bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40
                         hover:bg-accent-cyan/20 hover:border-accent-cyan/70
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
