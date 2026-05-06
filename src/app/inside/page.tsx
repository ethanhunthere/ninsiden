import type { Metadata } from "next";
import { InsidePage } from "@/components/inside/InsidePage";

export const metadata: Metadata = {
  title: "How LLMs Find Answers — NInsideN",
  description:
    "Step inside the transformer architecture — tokenisation, embeddings, self-attention, FFN, layer stacking, prediction, and autoregressive generation. All made visible.",
};

export default function Page() {
  return <InsidePage />;
}
