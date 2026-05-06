import type { TraceEventType } from "./types";

export const EVENT_LABELS: Record<TraceEventType, { icon: string; color: string }> = {
  trace_started: { icon: "⚡", color: "text-accent-cyan" },
  prompt_received: { icon: "📥", color: "text-accent-cyan" },
  prompt_normalized: { icon: "✂️", color: "text-accent-cyan" },
  tokens_created: { icon: "🔤", color: "text-accent-violet" },
  intent_detected: { icon: "🎯", color: "text-accent-violet" },
  retrieval_plan_created: { icon: "🗺️", color: "text-accent-cyan" },
  query_generated: { icon: "🔍", color: "text-accent-cyan" },
  search_started: { icon: "📡", color: "text-accent-cyan" },
  source_found: { icon: "📄", color: "text-accent-green" },
  chunk_selected: { icon: "🧩", color: "text-accent-green" },
  context_built: { icon: "🏗️", color: "text-accent-violet" },
  model_request_started: { icon: "🚀", color: "text-accent-violet" },
  model_token: { icon: "◈", color: "text-accent-cyan" },
  model_response_completed: { icon: "✅", color: "text-accent-green" },
  answer_completed: { icon: "💡", color: "text-accent-green" },
  trace_completed: { icon: "🏁", color: "text-accent-green" },
  error: { icon: "⚠️", color: "text-red-400" },
};
