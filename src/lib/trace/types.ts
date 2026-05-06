/**
 * Shared TypeScript types for the NInsideN trace pipeline.
 */

export type TraceEventType =
  | "trace_started"
  | "prompt_received"
  | "prompt_normalized"
  | "tokens_created"
  | "intent_detected"
  | "retrieval_plan_created"
  | "query_generated"
  | "search_started"
  | "source_found"
  | "chunk_selected"
  | "context_built"
  | "model_request_started"
  | "model_token"
  | "model_response_completed"
  | "answer_completed"
  | "trace_completed"
  | "error";

export interface TraceEvent {
  type: TraceEventType;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SourceItem {
  id: string;
  title: string;
  type: string;
  snippet: string;
  relevance: number;
  label: string;
  tags?: string[];
}

export interface ChunkItem {
  id: string;
  title: string;
  snippet: string;
  relevance: number;
}

export interface TraceState {
  status: "idle" | "running" | "completed" | "error";
  events: TraceEvent[];
  tokens: string[];
  answer: string;
  sources: SourceItem[];
  chunks: ChunkItem[];
  activeNode: PipelineNodeId | null;
  completedNodes: Set<PipelineNodeId>;
  error: string | null;
  intent: string | null;
  contextInfo: ContextInfo | null;
  modelInfo: ModelInfo | null;
}

export interface ContextInfo {
  chunk_count: number;
  token_estimate: number;
  context_preview: string;
}

export interface ModelInfo {
  model: string;
  openrouter_configured: boolean;
  stream: boolean;
}

export type PipelineNodeId =
  | "prompt"
  | "tokens"
  | "intent"
  | "retrieval"
  | "context"
  | "model"
  | "stream"
  | "answer";

export interface TraceCallbacks {
  onEvent: (event: TraceEvent) => void;
  onToken?: (token: string) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
}
