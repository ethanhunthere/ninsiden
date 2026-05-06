"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PromptPanel } from "./PromptPanel";
import { PipelineGraph } from "./PipelineGraph";
import { AnswerStream } from "./AnswerStream";
import { TraceTimeline } from "./TraceTimeline";
import { SourceInspector } from "./SourceInspector";
import { ContextInspector } from "./ContextInspector";
import { runTrace } from "@/lib/api/traceClient";
import { EVENT_NODE_MAP } from "@/lib/trace/constants";
import type {
  TraceState,
  TraceEvent,
  SourceItem,
  ChunkItem,
  PipelineNodeId,
} from "@/lib/trace/types";
import { cn } from "@/lib/utils";

// ── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_PROMPT"; payload: string }
  | { type: "START_RUN" }
  | { type: "ADD_EVENT"; payload: TraceEvent }
  | { type: "ADD_TOKEN"; payload: string }
  | { type: "COMPLETE" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET" };

const INITIAL_STATE: TraceState & { prompt: string } = {
  prompt: "",
  status: "idle",
  events: [],
  tokens: [],
  answer: "",
  sources: [],
  chunks: [],
  activeNode: null,
  completedNodes: new Set(),
  error: null,
  intent: null,
  contextInfo: null,
  modelInfo: null,
};

function reducer(
  state: typeof INITIAL_STATE,
  action: Action
): typeof INITIAL_STATE {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.payload };

    case "START_RUN":
      return {
        ...INITIAL_STATE,
        prompt: state.prompt,
        status: "running",
      };

    case "ADD_EVENT": {
      const ev = action.payload;
      const nextCompleted = new Set(state.completedNodes);

      // Advance node
      const node = EVENT_NODE_MAP[ev.type] as PipelineNodeId | undefined;
      let activeNode = state.activeNode;
      if (node) {
        if (activeNode && activeNode !== node) {
          nextCompleted.add(activeNode);
        }
        activeNode = node;
      }

      // Extract side-data
      const payload = ev.payload;
      let sources = state.sources;
      let chunks = state.chunks;
      let intent = state.intent;
      let contextInfo = state.contextInfo;
      let modelInfo = state.modelInfo;

      if (ev.type === "source_found") {
        sources = [...state.sources, payload as unknown as SourceItem];
      }
      if (ev.type === "chunk_selected") {
        chunks = [...state.chunks, payload as unknown as ChunkItem];
      }
      if (ev.type === "intent_detected") {
        intent = (payload.intent as string) ?? null;
      }
      if (ev.type === "context_built") {
        contextInfo = {
          chunk_count: payload.chunk_count as number,
          token_estimate: payload.token_estimate as number,
          context_preview: payload.context_preview as string,
        };
      }
      if (ev.type === "model_request_started") {
        modelInfo = {
          model: payload.model as string,
          openrouter_configured: payload.openrouter_configured as boolean,
          stream: true,
        };
      }
      if (ev.type === "trace_completed" || ev.type === "answer_completed") {
        if (activeNode) nextCompleted.add(activeNode);
      }

      return {
        ...state,
        events: ev.type !== "model_token" ? [...state.events, ev] : state.events,
        activeNode,
        completedNodes: nextCompleted,
        sources,
        chunks,
        intent,
        contextInfo,
        modelInfo,
      };
    }

    case "ADD_TOKEN":
      return {
        ...state,
        tokens: [...state.tokens, action.payload],
        answer: state.answer + action.payload,
      };

    case "COMPLETE":
      return { ...state, status: "completed", activeNode: null };

    case "SET_ERROR":
      return { ...state, status: "error", error: action.payload, activeNode: null };

    case "RESET":
      return { ...INITIAL_STATE, prompt: state.prompt };

    default:
      return state;
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Timeline", "Sources", "Context", "Raw Events"] as const;
type Tab = (typeof TABS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function TraceLab() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<Tab>("Timeline");
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = useCallback(async () => {
    if (!state.prompt.trim() || state.status === "running") return;

    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "START_RUN" });

    try {
      await runTrace(
        state.prompt,
        {
          onEvent: (ev) => dispatch({ type: "ADD_EVENT", payload: ev }),
          onToken: (tok) => dispatch({ type: "ADD_TOKEN", payload: tok }),
          onError: (err) =>
            dispatch({ type: "SET_ERROR", payload: err.message }),
          onDone: () => dispatch({ type: "COMPLETE" }),
        },
        controller.signal
      );
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Unexpected error during trace." });
    }
  }, [state.prompt, state.status]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  // Raw events for display (all including model_token)
  const rawEvents = state.events;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 3-column main layout */}
      <div className="grid lg:grid-cols-[280px_1fr_280px] gap-4 min-h-0">
        {/* Left — Prompt panel */}
        <div className="glass-panel p-4 flex flex-col gap-4 min-h-[520px]">
          <PromptPanel
            prompt={state.prompt}
            onChange={(v) => dispatch({ type: "SET_PROMPT", payload: v })}
            status={state.status}
            onRun={handleRun}
            onReset={handleReset}
            intent={state.intent}
          />
        </div>

        {/* Center — Pipeline + pipeline graph */}
        <div className="flex flex-col gap-4 min-h-[520px]">
          <PipelineGraph
            activeNode={state.activeNode}
            completedNodes={state.completedNodes}
            status={state.status}
          />

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Events", value: state.events.filter(e => e.type !== "model_token").length },
              { label: "Sources", value: state.sources.length },
              { label: "Tokens", value: state.tokens.length },
            ].map((s) => (
              <div
                key={s.label}
                className="glass-panel p-3 flex flex-col items-center gap-1"
              >
                <span className="text-xl font-bold text-accent-cyan font-mono">{s.value}</span>
                <span className="text-[10px] text-muted">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom tabs */}
          <div className="glass-panel flex flex-col flex-1 min-h-[220px] overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-panel-border shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                    activeTab === tab
                      ? "text-accent-cyan border-accent-cyan"
                      : "text-muted border-transparent hover:text-foreground"
                  )}
                >
                  {tab}
                  {tab === "Sources" && state.sources.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-accent-green/20 text-accent-green">
                      {state.sources.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "Timeline" && (
                <TraceTimeline events={state.events} />
              )}
              {activeTab === "Sources" && (
                <SourceInspector sources={state.sources} />
              )}
              {activeTab === "Context" && (
                <ContextInspector chunks={state.chunks} contextInfo={state.contextInfo} />
              )}
              {activeTab === "Raw Events" && (
                <div className="p-3 overflow-x-auto">
                  {state.events.length === 0 ? (
                    <p className="text-xs text-muted p-2">No events yet.</p>
                  ) : (
                    <pre className="text-[10px] text-foreground/60 font-mono leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(
                        state.events.filter((e) => e.type !== "model_token"),
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Answer stream */}
        <div className="glass-panel flex flex-col min-h-[520px] overflow-hidden">
          <AnswerStream
            tokens={state.tokens}
            answer={state.answer}
            status={state.status}
            error={state.error}
            modelInfo={state.modelInfo}
          />
        </div>
      </div>
    </div>
  );
}
