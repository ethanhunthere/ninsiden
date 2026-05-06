"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Organic neural network canvas — models a simplified Transformer architecture.
 * Layer order: Input → Embed → Attn → FFN → Attn → FFN → Output
 * Every adjacent-layer pair is fully connected with animated bezier-curve edges.
 */
const LAYERS = [
  { count: 5,  label: "Input",   color: "#00e5ff" },
  { count: 7,  label: "Embed",   color: "#00e5ff" },
  { count: 9,  label: "Attn",    color: "#9d7aff" },
  { count: 9,  label: "FFN",     color: "#9d7aff" },
  { count: 9,  label: "Attn",    color: "#9d7aff" },
  { count: 7,  label: "FFN",     color: "#9d7aff" },
  { count: 4,  label: "Output",  color: "#00e5a0" },
];

interface Pos  { x: number; y: number; li: number; ni: number }
interface Edge {
  from: Pos; to: Pos;
  cp1x: number; cp1y: number;
  cp2x: number; cp2y: number;
  phase: number;
  color: string;
}

function cbez(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function LLMNetworkVisual({ activeLayer }: { activeLayer?: number }) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const [dims, setDims] = useState({ w: 880, h: 330 });

  /* Observe container width and scale height proportionally */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(300, Math.floor(entries[0].contentRect.width));
      setDims({ w, h: Math.max(180, Math.floor(w * 330 / 880)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Main draw loop — re-runs whenever dims or activeLayer changes */
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    // Assign to a non-null alias so TypeScript's narrowing holds inside nested draw()
    const ctx = ctxRaw;
    const { w, h } = dims;

    /* ── Layout ── */
    const padX   = Math.max(28, w * 0.04);
    const padTop = 14;
    const padBot = 26;
    const usableH = h - padTop - padBot;
    const lspX  = (w - padX * 2) / (LAYERS.length - 1);
    const maxN  = Math.max(...LAYERS.map((l) => l.count));
    const gapY  = usableH / (maxN - 1);
    const nodeR = Math.max(5, Math.min(10, w * 0.0095));

    /* ── Node positions ── */
    const layerPos: Pos[][] = LAYERS.map((layer, li) => {
      const x      = padX + li * lspX;
      const totalH = (layer.count - 1) * gapY;
      const startY = padTop + (usableH - totalH) / 2;
      return Array.from({ length: layer.count }, (_, ni) => ({
        x, y: startY + ni * gapY, li, ni,
      }));
    });

    /* ── Precompute edges with organic bezier wobble ── */
    const edges: Edge[] = [];
    let ei = 0;
    for (let li = 0; li < LAYERS.length - 1; li++) {
      for (const from of layerPos[li]) {
        for (const to of layerPos[li + 1]) {
          const dx = to.x - from.x;
          // Deterministic wobble creates organic curves like a real NN diagram
          const wobble = Math.sin(from.ni * 2.17 + to.ni * 1.83 + li * 1.31) * gapY * 0.52;
          edges.push({
            from, to,
            cp1x: from.x + dx * 0.35,
            cp1y: from.y + (to.y - from.y) * 0.15 + wobble,
            cp2x: from.x + dx * 0.65,
            cp2y: from.y + (to.y - from.y) * 0.85 + wobble * 0.65,
            phase: (ei * 0.618033) % 1, // golden ratio spread for particles
            color: LAYERS[li].color,
          });
          ei++;
        }
      }
    }

    /* ── Animation ── */
    let tick = 0;
    const SPEED = 0.0038;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      /* Edges + signal particles */
      for (const { from, to, cp1x, cp1y, cp2x, cp2y, phase, color } of edges) {
        const active = activeLayer === from.li || activeLayer === to.li;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
        ctx.strokeStyle = color + (active ? "25" : "09");
        ctx.lineWidth   = active ? 0.9 : 0.5;
        ctx.stroke();

        const tp = (tick * SPEED + phase) % 1;
        ctx.beginPath();
        ctx.arc(
          cbez(tp, from.x, cp1x, cp2x, to.x),
          cbez(tp, from.y, cp1y, cp2y, to.y),
          active ? 2.2 : 1.3, 0, Math.PI * 2
        );
        ctx.fillStyle = color + (active ? "cc" : "3a");
        ctx.fill();
      }

      /* Nodes */
      for (let li = 0; li < LAYERS.length; li++) {
        const { color } = LAYERS[li];
        const active = activeLayer === li;
        const pulse  = 0.9 + 0.1 * Math.sin(tick * 0.022 + li * 1.1);

        for (const { x, y } of layerPos[li]) {
          if (active) {
            const grd = ctx.createRadialGradient(x, y, 0, x, y, nodeR * 3.2);
            grd.addColorStop(0, color + "30");
            grd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.beginPath();
            ctx.arc(x, y, nodeR * 3.2, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
          }

          // Body with radial gradient
          const body = ctx.createRadialGradient(x - nodeR * 0.25, y - nodeR * 0.25, 0, x, y, nodeR);
          body.addColorStop(0, color + (active ? "48" : "22"));
          body.addColorStop(1, "#06090f");
          ctx.beginPath();
          ctx.arc(x, y, nodeR * (active ? pulse : 1), 0, Math.PI * 2);
          ctx.fillStyle = body;
          ctx.fill();

          // Border ring
          ctx.beginPath();
          ctx.arc(x, y, nodeR, 0, Math.PI * 2);
          ctx.strokeStyle = color + (active ? "cc" : "3c");
          ctx.lineWidth   = active ? 1.5 : 0.75;
          ctx.stroke();

          // Inner glow dot
          ctx.beginPath();
          ctx.arc(x, y, nodeR * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = color + (active ? "ff" : "60");
          ctx.fill();
        }

        // Layer label
        const fs = Math.max(8, Math.min(10, w * 0.01));
        ctx.font      = `${fs}px monospace`;
        ctx.fillStyle = active ? color : "#374151";
        ctx.textAlign = "center";
        ctx.fillText(LAYERS[li].label, layerPos[li][0].x, h - 6);
      }

      tick++;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dims, activeLayer]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas
        ref={canvasRef}
        width={dims.w}
        height={dims.h}
        style={{ display: "block" }}
        aria-label="LLM transformer architecture — organic neural network visualization"
      />
    </div>
  );
}
