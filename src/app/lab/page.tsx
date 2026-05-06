import type { Metadata } from "next";
import { TraceLab } from "@/components/lab/TraceLab";

export const metadata: Metadata = {
  title: "Visual Trace Lab — NInsideN",
  description:
    "Watch your prompt move through the observable AI pipeline — tokens, retrieval, context, and live streaming response.",
};

export default function LabPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.04) 0%, transparent 60%)" }}
        aria-hidden
      />

      <div className="relative max-w-[1440px] mx-auto px-4 py-6">
        {/* Lab header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gradient tracking-tight">
              Visual Trace Lab
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Type a prompt and watch the full observable AI pipeline run live.
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="status-dot status-dot-live" />
            Pipeline ready
          </div>
        </div>

        <TraceLab />
      </div>
    </div>
  );
}

