import type { PipelineNodeId, TraceEventType } from "./types";

/**
 * Maps each trace event type to the pipeline node it activates.
 */
export const EVENT_NODE_MAP: Partial<Record<TraceEventType, PipelineNodeId>> = {
  prompt_received: "prompt",
  prompt_normalized: "prompt",
  tokens_created: "tokens",
  intent_detected: "intent",
  retrieval_plan_created: "retrieval",
  query_generated: "retrieval",
  search_started: "retrieval",
  source_found: "retrieval",
  chunk_selected: "retrieval",
  context_built: "context",
  model_request_started: "model",
  model_token: "stream",
  model_response_completed: "stream",
  answer_completed: "answer",
  trace_completed: "answer",
};

/**
 * Pipeline node definitions — order matters for visual layout.
 */
export const PIPELINE_NODES: {
  id: PipelineNodeId;
  label: string;
  sublabel: string;
}[] = [
  { id: "prompt", label: "Prompt", sublabel: "Input" },
  { id: "tokens", label: "Tokens", sublabel: "Tokenize" },
  { id: "intent", label: "Intent", sublabel: "Classify" },
  { id: "retrieval", label: "Retrieval", sublabel: "Search" },
  { id: "context", label: "Context", sublabel: "Build" },
  { id: "model", label: "Model", sublabel: "Request" },
  { id: "stream", label: "Stream", sublabel: "Tokens" },
  { id: "answer", label: "Answer", sublabel: "Assembled" },
];
