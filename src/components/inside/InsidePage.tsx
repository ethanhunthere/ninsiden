"use client";

import { useState, useEffect, Fragment } from "react";
import { AttentionMockVisual } from "@/components/visualizers/AttentionMockVisual";
import { LLMNetworkVisual } from "@/components/visualizers/LLMNetworkVisual";
import { TokenizerDemo } from "@/components/visualizers/TokenizerDemo";

/* ─────────────────────────── Step definitions ─────────────────────────── */

const STEPS = [
  {
    id: "tokens",
    label: "Tokenize",
    layerIdx: 0,
    color: "#00e5ff",
    title: "Tokenization",
    subtitle: "Text → Token IDs",
    math: "text → [id₀, id₁, …, idₙ]  ∈  ℤ⁺",
    body: `LLMs never read raw characters. Before anything else, your text is split into\n      sub-word tokens using Byte-Pair Encoding (BPE) — the same algorithm GPT-4 uses.\n      A word like "backpropagation" may become ["back", "prop", "agation"] depending on\n      how common those sub-strings are in training data. Token IDs are just integers\n      indexing a vocabulary of ~50 000 entries.`,
    facts: [
      "GPT-4 vocabulary: ~100,000 tokens",
      '"Hello world" = 2 tokens',
      '"Backpropagation" ≈ 3–4 tokens',
      "Token count drives API cost",
    ],
    visual: "tokenizer",
  },
  {
    id: "embed",
    label: "Embeddings",
    layerIdx: 1,
    color: "#00e5ff",
    title: "Embeddings",
    subtitle: "Token ID → Dense Vector",
    math: "id → e ∈ ℝᵈ   (d = 4 096 in GPT-4)",
    body: `Each token ID is looked up in a learned embedding table, producing a dense vector\n      of floating-point numbers. Similar tokens sit close together in this high-dimensional\n      space — "king" - "man" + "woman" ≈ "queen" is the classic example. The model also\n      adds positional encodings so it knows where in the sequence each token appears.`,
    facts: [
      "GPT-4 embedding dim: 4,096",
      "Position encoded as sinusoids or learned vectors",
      "Semantic similarity = vector cosine similarity",
      "The embedding table is learned during training",
    ],
    visual: "embeddings",
  },
  {
    id: "attn",
    label: "Attention",
    layerIdx: 2,
    color: "#9d7aff",
    title: "Self-Attention",
    subtitle: "Tokens attend to each other",
    math: "Attn(Q,K,V) = softmax(QKᵀ / √dₖ) · V",
    body: `Self-attention is the core innovation of Transformers. Every token projects into\n      three matrices — Query, Key, Value. Attention scores are computed by taking the\n      dot product of Q with every K, scaling by √dₖ to prevent vanishing gradients,\n      and passing through softmax. The result weights the Value vectors — each token\n      "looks at" the most relevant other tokens to build context.`,
    facts: [
      "GPT-4 has 96 attention heads per layer",
      "Each head learns a different relationship type",
      "Context window = max sequence length the model can attend to",
      "Flash Attention 2 makes this memory-efficient",
    ],
    visual: "attention",
  },
  {
    id: "ffn",
    label: "FFN",
    layerIdx: 3,
    color: "#9d7aff",
    title: "Feed-Forward Network",
    subtitle: "Per-token knowledge lookup",
    math: "FFN(x) = W₂ · ReLU(W₁x + b₁) + b₂",
    body: `After attention, each token independently passes through a two-layer feed-forward\n      network with a ReLU activation. The FFN is where most of the model's factual\n      knowledge is stored — the weight matrices act as key-value memories. The inner\n      layer is typically 4× the model dimension. A single Transformer block = Attention\n      + FFN, with residual connections and layer norm around both.`,
    facts: [
      "FFN inner dim = 4 × model dim (e.g., 16,384 in GPT-4)",
      "Each token's FFN is run independently — parallelisable",
      "Residual connections: x = x + FFN(LayerNorm(x))",
      "This is where factual knowledge lives",
    ],
    visual: "ffn",
  },
  {
    id: "depth",
    label: "96 Layers",
    layerIdx: 4,
    color: "#9d7aff",
    title: "Layer Stacking",
    subtitle: "Depth builds understanding",
    math: "h⁽ˡ⁾ = FFN(Attn(h⁽ˡ⁻¹⁾))   l = 1 … 96",
    body: `A complete Transformer block (Attention + FFN) is stacked 96 times in GPT-4.\n      Each layer refines the representation. Early layers capture grammar and surface\n      patterns. Middle layers build semantic understanding. Deep layers handle\n      multi-step reasoning and long-range factual recall. The depth is why scaling\n      language models keeps improving their abilities.`,
    facts: [
      "GPT-2 (2019): 12 layers, 117M params",
      "GPT-3 (2020): 96 layers, 175B params",
      "Each layer sees the full previous layer's output",
      "Residual stream grows richer with depth",
    ],
    visual: "depth",
  },
  {
    id: "predict",
    label: "Prediction",
    layerIdx: 5,
    color: "#9d7aff",
    title: "Next-Token Prediction",
    subtitle: "Hidden state → probability distribution",
    math: "P(wₜ | w₁…wₜ₋₁) = softmax(W_lm · hₙ)",
    body: `After all 96 layers, the final hidden state of the last token is multiplied\n      by the language model head (a linear projection back to vocabulary size) to\n      produce logit scores over all ~50 000 tokens. Softmax converts these to\n      probabilities. Temperature scales the logits before softmax — higher temperature\n      = more random. Top-p (nucleus) sampling picks from the smallest set of tokens\n      whose cumulative probability ≥ p.`,
    facts: [
      "Output is a distribution over the entire vocabulary",
      "Temperature < 1 = more deterministic",
      "Temperature > 1 = more creative/random",
      "Top-p = 0.9 means sample from 90% probability mass",
    ],
    visual: "prediction",
  },
  {
    id: "generate",
    label: "Generation",
    layerIdx: 6,
    color: "#00e5a0",
    title: "Autoregressive Generation",
    subtitle: "Repeat until done",
    math: "x̂ₜ ~ P(·|x₁…xₜ₋₁),   append x̂ₜ,   repeat",
    body: `The predicted token is appended to the sequence and fed back in as input.\n      The entire forward pass runs again, now attending to all previous tokens.\n      This repeats — one token per forward pass — until the model predicts an\n      end-of-sequence token or the maximum length is reached. Streaming works\n      by sending each token over SSE as soon as it's sampled, giving you the\n      live typewriter effect you see in ChatGPT.`,
    facts: [
      "1 forward pass → 1 token generated",
      "GPT-4: ~200B params per forward pass",
      "Streaming = send each token as it's sampled via SSE",
      "KV-cache avoids recomputing previous tokens",
    ],
    visual: "generation",
  },
] as const;

/* ─────────────────────────── Inline visuals ─────────────────────────── */

/** 32-dim embedding visualisation for 3 demo tokens */
function EmbeddingViz() {
  const DIM    = 32;
  const TOKENS = ["The", "cat", "sat"];

  const embeds = TOKENS.map((tok) =>
    Array.from({ length: DIM }, (_, i) =>
      Math.sin(tok.charCodeAt(0) * (i + 1) * 0.23 + i * 1.08) * 0.85
    )
  );

  return (
    <div className="neural-panel p-5">
      <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em] mb-4">
        Token Embeddings — 32-dim preview
      </p>
      <div className="space-y-3">
        {TOKENS.map((tok, ti) => (
          <div key={tok} className="flex items-center gap-3">
            <span className="text-xs font-mono text-foreground w-8 flex-shrink-0">
              &ldquo;{tok}&rdquo;
            </span>
            <div className="flex gap-px flex-1 h-7 items-stretch">
              {embeds[ti].map((v, di) => (
                <div
                  key={di}
                  className="flex-1 rounded-sm"
                  style={{
                    background:
                      v > 0
                        ? `rgba(0,229,255,${Math.abs(v) * 0.85})`
                        : `rgba(157,122,255,${Math.abs(v) * 0.85})`,
                  }}
                  title={`dim ${di}: ${v.toFixed(3)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-[10px] text-muted">
        <span>
          <span style={{ color: "#00e5ff" }}>■</span>&nbsp;positive
        </span>
        <span>
          <span style={{ color: "#9d7aff" }}>■</span>&nbsp;negative
        </span>
        <span className="ml-auto">actual GPT-4 dim: 4,096</span>
      </div>
    </div>
  );
}

/** Feed-forward network formula card */
function FFNViz() {
  const steps = [
    { label: "x",        note: "d_model",   color: "#00e5ff" },
    { label: "W₁x + b₁", note: "4×d_model", color: "#9d7aff" },
    { label: "ReLU",     note: "activation", color: "#9d7aff" },
    { label: "W₂ + b₂",  note: "d_model",   color: "#00e5a0" },
  ];

  return (
    <div className="neural-panel p-5">
      <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em] mb-5">
        Feed-Forward Block (per token)
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((s, i) => (
          <Fragment key={i}>
            <div className="text-center">
              <div
                className="rounded-lg px-3 py-1.5 text-xs font-mono"
                style={{
                  background:   s.color + "12",
                  border:       `1px solid ${s.color}30`,
                  color:         s.color,
                }}
              >
                {s.label}
              </div>
              <p className="text-[9px] text-muted mt-1">{s.note}</p>
            </div>
            {i < steps.length - 1 && (
              <span className="text-muted text-xs mt-[-14px]">→</span>
            )}
          </Fragment>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-panel-raised border border-panel-border px-4 py-3 font-mono text-xs text-foreground-dim">
        FFN(x) = W₂ · ReLU(W₁x + b₁) + b₂
      </div>
      <div className="mt-3 rounded-lg bg-panel-raised border border-panel-border px-4 py-3 font-mono text-xs text-foreground-dim">
        Block(x) = LayerNorm(x + Attn(x)) → LayerNorm(· + FFN(·))
      </div>
    </div>
  );
}

/** Depth / layer stacking visualisation */
function LayerDepthViz() {
  const SHOW = 18;
  const labels: Record<number, string> = {
    0:  "syntax / surface",
    6:  "semantics",
    12: "reasoning / facts",
    17: "output head",
  };

  return (
    <div className="neural-panel p-5">
      <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em] mb-5">
        Layer Depth — GPT-4: 96 layers
      </p>
      <div className="space-y-1.5">
        {Array.from({ length: SHOW }, (_, i) => {
          const t = i / (SHOW - 1);
          const c =
            i < SHOW * 0.35
              ? "#00e5ff"
              : i < SHOW * 0.7
              ? "#9d7aff"
              : "#00e5a0";
          return (
            <div key={i} className="flex items-center gap-3">
              <div
                className="rounded-full h-1.5 transition-all duration-300"
                style={{
                  width:   `${55 + t * 45}%`,
                  background: `linear-gradient(90deg, ${c}90, ${c}18)`,
                  opacity: 0.4 + t * 0.6,
                }}
              />
              {labels[i] && (
                <span className="text-[10px] text-muted whitespace-nowrap">
                  {labels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Real next-token predictions from /api/next-tokens */
function PredictionViz() {
  const [prefix, setPrefix]         = useState("The neural network");
  const [preds, setPreds]           = useState<{ token: string; prob: number }[]>([]);
  const [loading, setLoading]       = useState(false);
  const [apiMethod, setApiMethod]   = useState("");

  const FALLBACK = [
    { token: "predicts",  prob: 0.29 },
    { token: "learns",    prob: 0.22 },
    { token: "processes", prob: 0.16 },
    { token: "generates", prob: 0.11 },
    { token: "computes",  prob: 0.08 },
  ];

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!prefix.trim()) { setPreds([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/next-tokens?prefix=${encodeURIComponent(prefix)}`);
        if (!res.ok) throw new Error();
        const data: { tokens: typeof FALLBACK; method: string } = await res.json();
        setPreds(data.tokens.slice(0, 5));
        setApiMethod(data.method ?? "");
      } catch {
        setPreds(FALLBACK);
        setApiMethod("demo");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [prefix]);

  const BAR_COLORS = ["#00e5ff", "#9d7aff", "#00e5a0", "#9d7aff80", "#00e5ff60"];

  return (
    <div className="neural-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em]">
          Next-Token Predictions
        </p>
        {apiMethod && (
          <span className="text-[10px] text-muted font-mono">{apiMethod}</span>
        )}
      </div>
      <input
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        maxLength={120}
        className="w-full bg-transparent border border-panel-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-accent-cyan/40 mb-4"
        placeholder="Type a prefix…"
      />
      <div className="space-y-2">
        {loading && (
          <p className="text-xs text-muted animate-pulse">Querying model…</p>
        )}
        {!loading &&
          preds.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-foreground-dim w-[100px] truncate">
                &ldquo;{p.token}&rdquo;
              </span>
              <div className="flex-1 bg-panel h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width:      `${Math.max(3, p.prob * 100).toFixed(0)}%`,
                    background:  BAR_COLORS[i] ?? "#00e5ff",
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted w-12 text-right">
                {(p.prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

/** Animated autoregressive generation loop */
function GenerationLoopViz() {
  const SEQUENCE = [
    "The", "neural", "network", "processes", "each",
    "token", "step", "by", "step", "until", "done",
  ];
  const [idx, setIdx]         = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (complete) {
      const t = setTimeout(() => { setIdx(0); setComplete(false); }, 1800);
      return () => clearTimeout(t);
    }
    if (idx >= SEQUENCE.length) { setComplete(true); return; }
    const t = setTimeout(() => setIdx((n) => n + 1), 340);
    return () => clearTimeout(t);
  }, [idx, complete]);

  return (
    <div className="neural-panel p-5">
      <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em] mb-4">
        Autoregressive Generation
      </p>
      <div className="flex flex-wrap gap-1.5 min-h-[56px] items-center">
        {SEQUENCE.slice(0, idx).map((word, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded text-sm font-mono border transition-all duration-200"
            style={{
              color:       i === idx - 1 ? "#00e5ff" : "#dce8f5",
              borderColor: i === idx - 1 ? "#00e5ff40" : "#16213a",
              background:  i === idx - 1 ? "#00e5ff0c" : "transparent",
            }}
          >
            {word}
          </span>
        ))}
        {!complete && (
          <span
            className="inline-block w-0.5 h-4 rounded"
            style={{ background: "#00e5ff", animation: "pulse-dot 1s infinite" }}
          />
        )}
        {complete && (
          <span
            className="px-2 py-0.5 rounded text-xs font-mono border"
            style={{ color: "#00e5a0", borderColor: "#00e5a030", background: "#00e5a00c" }}
          >
            &lt;eos&gt;
          </span>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-panel-border flex gap-6 text-[11px] text-foreground-dim">
        <span>
          step{" "}
          <span className="font-mono" style={{ color: "#00e5ff" }}>
            {idx}
          </span>
        </span>
        <span>
          forward passes{" "}
          <span className="font-mono" style={{ color: "#9d7aff" }}>
            {idx}
          </span>
        </span>
        <span>
          {complete ? (
            <span style={{ color: "#00e5a0" }}>complete ✓</span>
          ) : (
            "generating…"
          )}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main page component ─────────────────────────── */

export function InsidePage() {
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-35" aria-hidden />
      <div
        className="absolute top-0 inset-x-0 h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, rgba(157,122,255,0.07) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* ── Page header ── */}
        <div className="mb-12 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted mb-5">
            Observable Pipeline
          </p>
          <h1
            className="font-bold text-gradient tracking-tight leading-tight mb-5"
            style={{ fontSize: "var(--text-display)" }}
          >
            How LLMs Find Answers
          </h1>
          <p className="text-foreground-dim text-lg max-w-2xl mx-auto leading-relaxed">
            Step inside the transformer architecture — from raw text to generated
            tokens, every layer made visible.
          </p>
        </div>

        {/* ── Organic neural network canvas ── */}
        <div className="neural-panel p-4 mb-3">
          <LLMNetworkVisual activeLayer={step.layerIdx} />
        </div>
        <p className="text-center text-[10px] text-muted mb-10">
          Click a step below to illuminate the corresponding layer
        </p>

        {/* ── Step selector ── */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border"
              style={
                activeStep === i
                  ? {
                      color:       s.color,
                      background:  s.color + "15",
                      borderColor: s.color + "50",
                      boxShadow:   `0 0 12px ${s.color}20`,
                    }
                  : {
                      color:       "#8ea4bc",
                      background:  "transparent",
                      borderColor: "#16213a",
                    }
              }
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>

        {/* ── Active step content ── */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left — prose */}
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <span
                className="text-xs font-mono font-bold opacity-40"
                style={{ color: step.color }}
              >
                0{activeStep + 1}
              </span>
              <h2 className="text-xl font-semibold text-foreground">
                {step.title}
              </h2>
            </div>
            <p
              className="text-xs font-mono mb-4"
              style={{ color: step.color + "cc" }}
            >
              {step.subtitle}
            </p>

            {/* Math expression */}
            <div className="rounded-lg bg-panel-raised border border-panel-border px-4 py-2.5 font-mono text-xs text-foreground-dim mb-5">
              {step.math}
            </div>

            <p className="text-sm text-foreground-dim leading-relaxed mb-6 whitespace-pre-line">
              {step.body.replace(/\n\s+/g, " ")}
            </p>

            {/* Key facts */}
            <div className="space-y-2">
              {step.facts.map((fact) => (
                <div key={fact} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: step.color }}
                  />
                  <p className="text-xs text-foreground-dim">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual */}
          <div>
            {step.visual === "tokenizer"  && <TokenizerDemo />}
            {step.visual === "embeddings" && <EmbeddingViz />}
            {step.visual === "attention"  && (
              <div className="neural-panel p-4">
                <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em] mb-3">
                  Attention Heatmap — Q × Kᵀ softmax
                </p>
                <AttentionMockVisual />
              </div>
            )}
            {step.visual === "ffn"        && <FFNViz />}
            {step.visual === "depth"      && <LayerDepthViz />}
            {step.visual === "prediction" && <PredictionViz />}
            {step.visual === "generation" && <GenerationLoopViz />}
          </div>
        </div>

        {/* ── Footer note ── */}
        <p className="mt-16 text-center text-xs text-muted/60 max-w-xl mx-auto leading-relaxed">
          NInsideN shows the observable application-level pipeline — tokenisation,
          retrieval, context assembly, and streaming. The model&apos;s private
          internal activations and weights are not accessible.
        </p>
      </div>
    </div>
  );
}
