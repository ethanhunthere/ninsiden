import type { Metadata } from "next";
import { NeuralLab } from "@/components/lab/NeuralLab";

export const metadata: Metadata = {
  title: "Neural Lab — NInsideN",
  description:
    "Ask any question and watch a real LLM find the answer — live BPE tokens, real next-token logprobs, streaming response, and the transformer architecture lighting up layer by layer.",
};

export default function LabPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-35" aria-hidden />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.06) 0%, rgba(157,122,255,0.03) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-[1440px] mx-auto px-4 lg:px-6 py-8 lg:py-12">
        {/* Hero header */}
        <header className="mb-8">
          <p className="text-[10px] font-semibold text-accent-cyan uppercase tracking-[0.2em] mb-3">
            Neural Lab · Live
          </p>
          <h1
            className="text-gradient font-bold tracking-tight"
            style={{ fontSize: "var(--text-display)", lineHeight: 1.05 }}
          >
            Watch how an LLM finds the answer.
          </h1>
          <p className="text-foreground-dim text-base lg:text-lg max-w-3xl mt-3 leading-relaxed">
            Ask anything — even <span className="text-accent-cyan font-mono">2 + 2</span>.
            Real BPE tokens, real next-token logprobs from a hosted model,
            real streaming response, and the transformer architecture lighting up
            <span className="text-accent-violet"> layer by layer </span>
            as your question travels through it.
          </p>
        </header>

        <NeuralLab />
      </div>
    </div>
  );
}
