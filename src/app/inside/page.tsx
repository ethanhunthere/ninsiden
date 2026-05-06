import type { Metadata } from "next";
import { TokenFlowVisual } from "@/components/visualizers/TokenFlowVisual";
import { SearchRadarVisual } from "@/components/visualizers/SearchRadarVisual";
import { ContextWindowVisual } from "@/components/visualizers/ContextWindowVisual";
import { AttentionMockVisual } from "@/components/visualizers/AttentionMockVisual";

export const metadata: Metadata = {
  title: "Inside AI",
  description: "How AI applications process your prompt — tokens, retrieval, context, and streaming.",
};

const SECTIONS = [
  {
    id: "prompt",
    icon: "📥",
    title: "A. Prompt",
    color: "#00d4ff",
    body: "A prompt is the text you send to an AI system. At the application level, it is received as a raw string, validated for length and safety, and then passed into the processing pipeline. The prompt drives every downstream step — tokenisation, retrieval, and model generation.",
  },
  {
    id: "tokens",
    icon: "🔤",
    title: "B. Tokens",
    color: "#8b5cf6",
    visual: "tokens",
    body: "LLMs do not read raw text. They process tokens — sub-word units produced by algorithms like Byte-Pair Encoding (BPE). A word like 'backpropagation' may split into three or four tokens. Token count determines context window usage and inference cost. The NInsideN trace shows a simplified word-level tokeniser for educational clarity.",
  },
  {
    id: "embeddings",
    icon: "📐",
    title: "C. Embeddings",
    color: "#8b5cf6",
    body: "An embedding converts text into a dense vector of floating-point numbers that captures semantic meaning. Similar concepts sit close together in high-dimensional vector space. Embeddings power semantic search and retrieval in RAG systems. The model itself has learned its own internal embedding table, but app-level embeddings for retrieval are a separate, observable component.",
  },
  {
    id: "rag",
    icon: "🔍",
    title: "D. Retrieval / RAG",
    color: "#00d4ff",
    visual: "radar",
    body: "Retrieval-Augmented Generation (RAG) augments the model with external knowledge before it generates an answer. The app retrieves relevant documents or chunks from a knowledge base and includes them in the context. NInsideN v1 uses a local demo knowledge base. The retrieval step is fully observable — sources are labelled honestly as local demo knowledge.",
  },
  {
    id: "context",
    icon: "🏗️",
    title: "E. Context Window",
    color: "#8b5cf6",
    visual: "context",
    body: "The context window is the total token budget the model can see at once. The application assembles a context package containing the system prompt, retrieved knowledge chunks, and the user's message. Fitting the right information into the context window is a core RAG engineering challenge. NInsideN shows the context building step explicitly.",
  },
  {
    id: "model",
    icon: "🚀",
    title: "F. Model Response",
    color: "#8b5cf6",
    body: "The model receives the assembled context window and begins predicting the next most likely token. It does not 'think' — it computes probability distributions over vocabulary. The model is a black box; NInsideN does not claim to reveal its internal workings. We visualise the request and response, not the model's private computation.",
  },
  {
    id: "streaming",
    icon: "◈",
    title: "G. Streaming",
    color: "#10b981",
    body: "Tokens are generated one at a time and sent immediately over Server-Sent Events (SSE). The application appends each token to the displayed text, creating the live typewriter effect. Streaming reduces perceived latency from several seconds to near-instant first-token response. NInsideN streams every token as a traceable event.",
  },
  {
    id: "citations",
    icon: "📄",
    title: "H. Citations and Sources",
    color: "#10b981",
    visual: "attention",
    body: "When real search APIs (e.g. Brave, Serper, Tavily) are configured, sources can be cited with URLs and snippets. In NInsideN v1, sources come from the local demo knowledge base and are clearly labelled as such. No live web search is performed by default. Future versions will add real-time retrieval with honest source attribution.",
  },
];

export default function InsidePage() {
  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Inside AI</span>
          </h1>
          <p className="text-foreground/50 text-lg max-w-2xl mx-auto">
            How AI applications process your prompt — the transparent, observable pipeline
            from input text to streamed answer.
          </p>
          <p className="mt-3 text-xs text-muted">
            NInsideN visualises the application-level pipeline. It does not claim to expose
            private hidden model reasoning.
          </p>
        </div>

        <div className="space-y-12">
          {SECTIONS.map((sec, i) => (
            <div
              key={sec.id}
              className="grid md:grid-cols-2 gap-8 items-start"
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{sec.icon}</span>
                  <h2 className="text-xl font-bold" style={{ color: sec.color }}>
                    {sec.title}
                  </h2>
                </div>
                <p className="text-foreground/60 leading-relaxed text-sm">{sec.body}</p>
              </div>

              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                {sec.visual === "tokens" && <TokenFlowVisual />}
                {sec.visual === "radar" && <SearchRadarVisual />}
                {sec.visual === "context" && <ContextWindowVisual />}
                {sec.visual === "attention" && <AttentionMockVisual />}
                {!sec.visual && (
                  <div className="rounded-xl bg-panel border border-panel-border p-6 flex items-center justify-center min-h-[140px]">
                    <span className="text-5xl opacity-20">{sec.icon}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
