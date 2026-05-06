import type { Metadata } from "next";
import { TraceLab } from "@/components/lab/TraceLab";

export const metadata: Metadata = {
  title: "Visual Trace Lab",
  description:
    "Watch your prompt move through the observable AI pipeline — tokens, retrieval, context, and live streaming response.",
};

export default function LabPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            <span className="text-gradient">Visual Trace Lab</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            Type a prompt and watch the full observable AI pipeline run live.
          </p>
        </div>
        <TraceLab />
      </div>
    </div>
  );
}
