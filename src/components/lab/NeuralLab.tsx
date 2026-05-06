"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { LLMNetworkVisual } from "@/components/visualizers/LLMNetworkVisual";
import { runTrace } from "@/lib/api/traceClient";
import type { TraceEvent, TraceEventType } from "@/lib/trace/types";

/* ─────────────────────────── Layer mapping ────────────────────────────── */
/**
 * Map a trace event to a layer index in LLMNetworkVisual (0..6).
 *  0 Input  1 Embed  2 Attn  3 FFN  4 Attn  5 FFN/Predict  6 Output
 */
const EVENT_TO_LAYER: Partial<Record<TraceEventType, number>> = {
  trace_started: 0,
  prompt_received: 0,
  prompt_normalized: 0,
  tokens_created: 0,
  intent_detected: 1,
  retrieval_plan_created: 2,
  query_generated: 2,
  search_started: 2,
  source_found: 2,
  chunk_selected: 3,
  context_built: 4,
  model_request_started: 5,
  model_token: 6,
  model_response_completed: 6,
  answer_completed: 6,
  trace_completed: 6,
};

const LAYER_META = [
  { name: "Tokenize",   color: "#00e5ff", description: "Splitting your prompt into BPE sub-word tokens." },
  { name: "Embed",      color: "#00e5ff", description: "Looking up each token's 4 096-dim vector." },
  { name: "Attention",  color: "#9d7aff", description: "Tokens attending to each other — building context." },
  { name: "FFN + Retrieve", color: "#9d7aff", description: "Feed-forward networks looking up factual knowledge." },
  { name: "Deep Layers",color: "#9d7aff", description: "Stacked Transformer blocks refining the representation." },
  { name: "Predict",    color: "#9d7aff", description: "Final hidden state → softmax over the vocabulary." },
  { name: "Generate",   color: "#00e5a0", description: "Sampling the next token & streaming it to you." },
];

const EXAMPLE_PROMPTS = [
  "What is 2 + 2?",
  "Why is the sky blue?",
  "What is the capital of France?",
  "Explain how a transformer works in 2 sentences.",
];

/* ─────────────────────────── State ───────────────────────────────────── */

type Status = "idle" | "running" | "completed" | "error";

interface State {
  prompt: string;
  status: Status;
  events: TraceEvent[];
  tokens: string[];
  answer: string;
  activeLayer: number | null;
  highestLayer: number;
  error: string | null;
  intent: string | null;
  modelName: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

const INITIAL: State = {
  prompt: "",
  status: "idle",
  events: [],
  tokens: [],
  answer: "",
  activeLayer: null,
  highestLayer: -1,
  error: null,
  intent: null,
  modelName: null,
  startedAt: null,
  completedAt: null,
};

type Action =
  | { type: "SET_PROMPT"; payload: string }
  | { type: "START" }
  | { type: "EVENT"; payload: TraceEvent }
  | { type: "TOKEN"; payload: string }
  | { type: "DONE" }
  | { type: "ERROR"; payload: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.payload };

    case "START":
      return {
        ...INITIAL,
        prompt: state.prompt,
        status: "running",
        startedAt: Date.now(),
      };

    case "EVENT": {
      const ev = action.payload;
      const layer = EVENT_TO_LAYER[ev.type];
      const nextActive = layer !== undefined ? layer : state.activeLayer;
      const nextHighest =
        layer !== undefined && layer > state.highestLayer
          ? layer
          : state.highestLayer;

      let intent = state.intent;
      let modelName = state.modelName;
      if (ev.type === "intent_detected") {
        intent = (ev.payload.intent_label as string) ?? (ev.payload.intent as string) ?? null;
      }
      if (ev.type === "model_request_started") {
        modelName = (ev.payload.model as string) ?? null;
      }

      return {
        ...state,
        events: ev.type !== "model_token" ? [...state.events, ev] : state.events,
        activeLayer: nextActive,
        highestLayer: nextHighest,
        intent,
        modelName,
      };
    }

    case "TOKEN":
      return {
        ...state,
        tokens: [...state.tokens, action.payload],
        answer: state.answer + action.payload,
        activeLayer: 6,
        highestLayer: 6,
      };

    case "DONE":
      return {
        ...state,
        status: "completed",
        activeLayer: 6,
        highestLayer: 6,
        completedAt: Date.now(),
      };

    case "ERROR":
      return { ...state, status: "error", error: action.payload };

    case "RESET":
      return { ...INITIAL, prompt: state.prompt };

    default:
      return state;
  }
}

/* ─────────────────────────── Helpers ─────────────────────────────────── */

interface BpeToken {
  id: number;
  text: string;
  token_id: number;
  type: string;
}

const TOKEN_COLORS: Record<string, string> = {
  word:        "#00e5ff",
  subword:     "#9d7aff",
  stop_word:   "#8ea4bc",
  punctuation: "#00e5a0",
  number:      "#f59e0b",
  space:       "#4a5a72",
};

interface NextToken { token: string; prob: number }

/* ─────────────────────────── Subviews ────────────────────────────────── */

function TokenStrip({
  prompt,
  active,
}: {
  prompt: string;
  active: boolean;
}) {
  const [tokens, setTokens] = useState<BpeToken[]>([]);
  const [method, setMethod] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const text = prompt.trim();
    if (!text) {
      setTokens([]);
      setMethod("");
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tokenize?text=${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error("tokenize failed");
        const data: { tokens: BpeToken[]; method: string } = await res.json();
        if (cancelled) return;
        setTokens(data.tokens);
        setMethod(data.method ?? "");
      } catch {
        if (cancelled) return;
        // Word-level fallback
        const fb: BpeToken[] = text.split(/(\s+)/).filter(Boolean).map((w, i) => ({
          id: i,
          text: w,
          token_id: -1,
          type: /\s/.test(w) ? "space" : /[.,!?;:]/.test(w) ? "punctuation" : "word",
        }));
        setTokens(fb);
        setMethod("client-fallback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [prompt]);

  const visible = tokens.filter((t) => t.type !== "space");

  return (
    <div className={`neural-panel p-4 transition-all ${active ? "shadow-glow-sm-cyan" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
          1 · Tokens of your prompt
        </p>
        <span className="text-[10px] text-muted font-mono">
          {method || "—"} · {visible.length} tok
        </span>
      </div>
      {!prompt.trim() ? (
        <p className="text-xs text-foreground-dim italic">
          Type a question above to see real BPE tokens.
        </p>
      ) : loading && visible.length === 0 ? (
        <p className="text-xs text-muted animate-pulse">Tokenising…</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visible.slice(0, 64).map((t) => {
            const color = TOKEN_COLORS[t.type] ?? "#dce8f5";
            return (
              <span
                key={t.id}
                className="px-2 py-0.5 rounded text-xs font-mono border"
                style={{
                  color,
                  borderColor: color + "30",
                  background: color + "0c",
                }}
                title={`type: ${t.type}${t.token_id >= 0 ? `   id: ${t.token_id}` : ""}`}
              >
                {t.text}
              </span>
            );
          })}
          {visible.length > 64 && (
            <span className="text-[10px] text-muted px-2 py-0.5">
              +{visible.length - 64} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PredictionStrip({
  prompt,
  active,
}: {
  prompt: string;
  active: boolean;
}) {
  const [preds, setPreds] = useState<NextToken[]>([]);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const text = prompt.trim();
    if (!text) {
      setPreds([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/next-tokens?prefix=${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error("predict failed");
        const data: { tokens: NextToken[]; method: string } = await res.json();
        if (cancelled) return;
        setPreds(data.tokens.slice(0, 5));
        setMethod(data.method ?? "");
      } catch {
        if (cancelled) return;
        setPreds([]);
        setMethod("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [prompt]);

  const BAR_COLORS = ["#00e5ff", "#9d7aff", "#00e5a0", "#9d7aff80", "#00e5ff60"];

  return (
    <div className={`neural-panel p-4 transition-all ${active ? "shadow-glow-sm-violet" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
          2 · Top-5 next-token predictions
        </p>
        <span className="text-[10px] text-muted font-mono">{method || "—"}</span>
      </div>
      {!prompt.trim() ? (
        <p className="text-xs text-foreground-dim italic">
          Predictions will appear once you type.
        </p>
      ) : loading && preds.length === 0 ? (
        <p className="text-xs text-muted animate-pulse">Querying model…</p>
      ) : preds.length === 0 ? (
        <p className="text-xs text-muted">No predictions available.</p>
      ) : (
        <div className="space-y-2">
          {preds.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-foreground-dim w-[90px] truncate">
                &ldquo;{p.token}&rdquo;
              </span>
              <div className="flex-1 bg-panel h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(3, p.prob * 100).toFixed(0)}%`,
                    background: BAR_COLORS[i] ?? "#00e5ff",
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted w-12 text-right">
                {(p.prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerPanel({
  answer,
  status,
  modelName,
  tokenCount,
  error,
}: {
  answer: string;
  status: Status;
  modelName: string | null;
  tokenCount: number;
  error: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === "running") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [answer, status]);

  return (
    <div className="neural-panel flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-panel-border shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-glow-sm-green" />
        <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
          3 · Streamed answer
        </span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted">
          {status === "running" && (
            <span className="flex items-center gap-1.5 text-accent-green">
              <span className="status-dot status-dot-live" />
              streaming
            </span>
          )}
          {status === "completed" && (
            <span className="text-accent-green">✓ complete</span>
          )}
          <span className="font-mono">{tokenCount} tok</span>
          {modelName && (
            <span className="font-mono truncate max-w-[140px]">{modelName}</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0 text-sm">
        {error ? (
          <p className="text-accent-amber text-xs">{error}</p>
        ) : !answer && status === "idle" ? (
          <p className="text-xs text-foreground-dim italic">
            The model&apos;s answer will appear here, token by token, as the network fires.
          </p>
        ) : !answer && status === "running" ? (
          <p className="text-xs text-muted animate-pulse">Waiting for first token…</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-li:my-0 prose-code:text-accent-cyan prose-code:bg-panel prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function EventLog({
  events,
  status,
  startedAt,
  completedAt,
  intent,
}: {
  events: TraceEvent[];
  status: Status;
  startedAt: number | null;
  completedAt: number | null;
  intent: string | null;
}) {
  const elapsed =
    startedAt && (completedAt ?? Date.now())
      ? ((completedAt ?? Date.now()) - startedAt) / 1000
      : 0;

  return (
    <div className="neural-panel flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-panel-border shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
        <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
          4 · Pipeline events
        </span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted font-mono">
          {intent && <span className="text-accent-violet">{intent}</span>}
          {startedAt && <span>{elapsed.toFixed(1)}s</span>}
          <span>{events.length} evt</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 min-h-0 space-y-1">
        {events.length === 0 ? (
          <p className="text-xs text-foreground-dim italic px-1 py-1">
            Events will stream in here as the pipeline runs.
          </p>
        ) : (
          events.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2 py-1.5 rounded text-[11px] hover:bg-panel-raised/40 transition-colors"
            >
              <span
                className="mt-1 w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: layerColorForEvent(ev.type) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium leading-tight truncate">
                  {ev.title}
                </p>
                <p className="text-muted leading-tight truncate">
                  {ev.description}
                </p>
              </div>
            </div>
          ))
        )}
        {status === "running" && (
          <p className="text-[10px] text-muted px-2 py-1 animate-pulse">
            …
          </p>
        )}
      </div>
    </div>
  );
}

function layerColorForEvent(type: TraceEventType): string {
  const layer = EVENT_TO_LAYER[type];
  if (layer === undefined) return "#4a5a72";
  return LAYER_META[layer]?.color ?? "#4a5a72";
}

/* ─────────────────────────── Main component ──────────────────────────── */

export function NeuralLab() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  // Hold the prompt that is actually running, so token/prediction strips
  // keep showing the active question, not what the user is typing for the next run.
  const [activePrompt, setActivePrompt] = useState("");

  const handleRun = useCallback(async () => {
    const text = state.prompt.trim();
    if (!text || state.status === "running") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setActivePrompt(text);
    dispatch({ type: "START" });

    try {
      await runTrace(
        text,
        {
          onEvent: (ev) => dispatch({ type: "EVENT", payload: ev }),
          onToken: (tok) => dispatch({ type: "TOKEN", payload: tok }),
          onError: (err) => dispatch({ type: "ERROR", payload: err.message }),
          onDone: () => dispatch({ type: "DONE" }),
        },
        controller.signal
      );
    } catch {
      dispatch({ type: "ERROR", payload: "Unexpected error during trace." });
    }
  }, [state.prompt, state.status]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET" });
    setActivePrompt("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleRun();
      }
    },
    [handleRun]
  );

  const layer = state.activeLayer;
  const layerInfo = layer !== null ? LAYER_META[layer] : null;
  const tokenCount = state.tokens.length;

  // Progress 0..1 across the 7 layers
  const progress = useMemo(() => {
    if (state.status === "completed") return 1;
    if (state.highestLayer < 0) return 0;
    return (state.highestLayer + 1) / LAYER_META.length;
  }, [state.highestLayer, state.status]);

  // The prompt strip shows tokens/predictions for whatever is most relevant:
  // active prompt while running/completed, otherwise the prompt being typed.
  const stripPrompt = activePrompt || state.prompt;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Prompt panel ───────────────────────────────────────────── */}
      <div className="neural-panel p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
              Ask anything · the network will fire end-to-end
            </label>
            <textarea
              value={state.prompt}
              onChange={(e) => dispatch({ type: "SET_PROMPT", payload: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="e.g. What is 2 + 2?"
              rows={2}
              maxLength={600}
              className="w-full bg-transparent border border-panel-border rounded-xl px-4 py-3 text-base text-foreground font-medium placeholder:text-muted focus:outline-none focus:border-accent-cyan/50 focus:shadow-glow-sm-cyan resize-none transition-all"
              disabled={state.status === "running"}
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => dispatch({ type: "SET_PROMPT", payload: p })}
                  disabled={state.status === "running"}
                  className="px-2.5 py-1 text-[11px] rounded-full border border-panel-border text-foreground-dim hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex lg:flex-col gap-2 lg:w-[160px] lg:justify-center">
            <button
              onClick={handleRun}
              disabled={!state.prompt.trim() || state.status === "running"}
              className="flex-1 lg:flex-none px-5 py-3 rounded-xl bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/25 hover:shadow-glow-sm-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {state.status === "running" ? "Running…" : "Run network"}
            </button>
            <button
              onClick={handleReset}
              disabled={state.status === "idle"}
              className="px-4 py-3 rounded-xl border border-panel-border text-foreground-dim text-xs hover:text-foreground hover:border-panel-border-bright disabled:opacity-30 transition-colors"
            >
              Reset
            </button>
            <p className="hidden lg:block text-[10px] text-muted text-center mt-1">
              ⌘/Ctrl + Enter
            </p>
          </div>
        </div>
      </div>

      {/* ── Live status strip ───────────────────────────────────────── */}
      <div className="neural-panel p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: layerInfo?.color ?? "#4a5a72",
              boxShadow: layerInfo
                ? `0 0 12px ${layerInfo.color}80`
                : undefined,
              animation: state.status === "running" ? "pulse-dot 1.4s infinite" : undefined,
            }}
          />
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">
              {state.status === "idle" && "Ready"}
              {state.status === "running" && "Running"}
              {state.status === "completed" && "Complete"}
              {state.status === "error" && "Error"}
            </p>
            <p className="text-sm font-medium text-foreground">
              {layerInfo
                ? `Layer ${(layer ?? 0) + 1}/${LAYER_META.length} · ${layerInfo.name}`
                : "Idle — waiting for a question"}
            </p>
          </div>
        </div>

        <p className="text-xs text-foreground-dim flex-1 min-w-[200px]">
          {layerInfo?.description ??
            "Type a question and press Run. Real BPE tokens, real next-token logprobs, real streaming answer."}
        </p>

        <div className="flex items-center gap-3 ml-auto">
          <div className="w-32 h-1.5 rounded-full bg-panel overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${(progress * 100).toFixed(0)}%`,
                background:
                  state.status === "completed"
                    ? "linear-gradient(90deg, #00e5ff, #9d7aff, #00e5a0)"
                    : `linear-gradient(90deg, #00e5ff, ${layerInfo?.color ?? "#9d7aff"})`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted w-10 text-right">
            {(progress * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* ── Neural network visualisation ────────────────────────────── */}
      <div className="neural-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.15em]">
            Transformer architecture · 7 layers · live activation
          </p>
          <div className="flex gap-3 text-[10px] text-muted">
            {LAYER_META.map((l, i) => (
              <span
                key={i}
                className="flex items-center gap-1"
                style={{
                  color: state.activeLayer === i ? l.color : undefined,
                  fontWeight: state.activeLayer === i ? 600 : 400,
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: l.color, opacity: state.activeLayer === i ? 1 : 0.4 }}
                />
                {l.name}
              </span>
            ))}
          </div>
        </div>
        <LLMNetworkVisual activeLayer={state.activeLayer ?? undefined} />
      </div>

      {/* ── Live data grid: tokens · predictions · answer · events ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TokenStrip prompt={stripPrompt} active={state.activeLayer === 0} />
        <PredictionStrip prompt={stripPrompt} active={state.activeLayer === 5} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 min-h-[360px]">
        <AnswerPanel
          answer={state.answer}
          status={state.status}
          modelName={state.modelName}
          tokenCount={tokenCount}
          error={state.error}
        />
        <EventLog
          events={state.events}
          status={state.status}
          startedAt={state.startedAt}
          completedAt={state.completedAt}
          intent={state.intent}
        />
      </div>
    </div>
  );
}
