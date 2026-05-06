"use client";

import { useEffect, useRef } from "react";

const TOKENS_DEMO = ["How", "does", "attention", "work", "?"];
const WEIGHTS = [
  [0.8, 0.2, 0.6, 0.1, 0.05],
  [0.1, 0.9, 0.3, 0.15, 0.1],
  [0.4, 0.3, 0.95, 0.4, 0.2],
  [0.05, 0.1, 0.5, 0.85, 0.3],
  [0.05, 0.05, 0.1, 0.2, 0.7],
];

export function AttentionMockVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const n = TOKENS_DEMO.length;
    const padX = 60;
    const padY = 36;
    const cellW = (W - padX) / n;
    const cellH = (H - padY) / n;

    let t = 0;

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Heatmap cells
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const w = WEIGHTS[row][col];
          const animW = Math.max(0, Math.min(1, w + 0.05 * Math.sin(t * 0.03 + row + col)));

          const x = padX + col * cellW;
          const y = padY + row * cellH;

          // Interpolate color: transparent→cyan
          const r = Math.round(0 + animW * 0);
          const g = Math.round(0 + animW * 212);
          const b = Math.round(50 + animW * 205);
          ctx!.fillStyle = `rgba(${r},${g},${b},${0.15 + animW * 0.65})`;
          ctx!.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

          // Value
          ctx!.font = `8px var(--font-mono, monospace)`;
          ctx!.fillStyle = animW > 0.5 ? "#dce8f5" : "#4a5568";
          ctx!.textAlign = "center";
          ctx!.fillText(animW.toFixed(2), x + cellW / 2, y + cellH / 2 + 3);
        }
      }

      // Column labels (keys)
      for (let col = 0; col < n; col++) {
        ctx!.font = `8.5px var(--font-inter, system-ui)`;
        ctx!.fillStyle = "#4a5a72";
        ctx!.textAlign = "center";
        ctx!.fillText(
          TOKENS_DEMO[col],
          padX + col * cellW + cellW / 2,
          padY - 8
        );
      }

      // Row labels (queries)
      for (let row = 0; row < n; row++) {
        ctx!.font = `8.5px var(--font-inter, system-ui)`;
        ctx!.fillStyle = "#4a5a72";
        ctx!.textAlign = "right";
        ctx!.fillText(
          TOKENS_DEMO[row],
          padX - 5,
          padY + row * cellH + cellH / 2 + 3
        );
      }

      // Grid
      ctx!.strokeStyle = "rgba(30,34,60,0.5)";
      ctx!.lineWidth = 0.5;
      for (let i = 0; i <= n; i++) {
        ctx!.beginPath();
        ctx!.moveTo(padX + i * cellW, padY);
        ctx!.lineTo(padX + i * cellW, padY + n * cellH);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.moveTo(padX, padY + i * cellH);
        ctx!.lineTo(padX + n * cellW, padY + i * cellH);
        ctx!.stroke();
      }

      t += 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="rounded-xl bg-panel border border-panel-border p-4">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
        Attention Mock — Simulated weights
      </p>
      <p className="text-[10px] text-muted/60 mb-3">
        This is a simulated visualisation. Real attention weights are internal to the model.
      </p>
      <canvas
        ref={canvasRef}
        width={300}
        height={240}
        className="w-full"
        aria-label="Attention weight visualisation"
      />
    </div>
  );
}
