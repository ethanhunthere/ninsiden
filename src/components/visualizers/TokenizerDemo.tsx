"use client";

import { useState, useEffect } from "react";

interface Token {
  id: number;
  text: string;
  type: string;
}

const COLOR: Record<string, string> = {
  word:        "#00e5ff",
  subword:     "#9d7aff",
  stop_word:   "#4a5a72",
  punctuation: "#00e5a0",
  number:      "#f59e0b",
  space:       "#4a5a72",
  bpe_token:   "#00e5ff",
};

const DEMO = "The neural network learns by adjusting its weights.";

export function TokenizerDemo() {
  const [text, setText]     = useState(DEMO);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!text.trim()) { setTokens([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/tokenize?text=${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error();
        const data: { tokens: Token[]; total: number; method: string } = await res.json();
        setTokens(data.tokens);
        setMethod(data.method ?? "");
      } catch {
        // Fallback: naive word split so the UI is always functional
        setTokens(
          text.trim().split(/(\s+|[,.!?;:])/).filter(Boolean).map((t, i) => ({
            id: i, text: t, type: /^\s+$/.test(t) ? "space" : /^[^\w\s]$/.test(t) ? "punctuation" : "word",
          }))
        );
        setMethod("word-level fallback");
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [text]);

  const wordTokens = tokens.filter((t) => t.type !== "space");

  return (
    <div className="neural-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-medium text-muted uppercase tracking-[0.15em]">
          Live Tokenizer
        </p>
        {method && (
          <span className="text-[10px] text-muted font-mono">{method}</span>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder="Type any sentence…"
        className="w-full bg-transparent border border-panel-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-accent-cyan/40 mb-4 font-mono"
      />

      {/* Token chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {loading && (
          <span className="text-xs text-muted animate-pulse">Tokenizing…</span>
        )}
        {!loading && wordTokens.map((tok) => (
          <span
            key={tok.id}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border transition-all duration-150"
            style={{
              color:        COLOR[tok.type] ?? "#dce8f5",
              borderColor: (COLOR[tok.type] ?? "#dce8f5") + "30",
              background:  (COLOR[tok.type] ?? "#dce8f5") + "0e",
            }}
            title={`type: ${tok.type}  id: ${tok.id}`}
          >
            {tok.text}
          </span>
        ))}
      </div>

      {wordTokens.length > 0 && (
        <div className="mt-4 pt-3 border-t border-panel-border flex items-start gap-6">
          <div>
            <span
              className="text-2xl font-bold font-mono"
              style={{ color: "#00e5ff" }}
            >
              {wordTokens.length}
            </span>
            <p className="text-[10px] text-muted">tokens</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {Object.entries(COLOR)
              .filter(([k]) => k !== "space")
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[10px] text-muted capitalize">
                    {type.replace("_", " ")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
