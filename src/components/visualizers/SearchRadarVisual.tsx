"use client";

import { useEffect, useRef } from "react";

const SOURCES = [
  { angle: 0.3, dist: 0.55, label: "Neural Networks" },
  { angle: 1.1, dist: 0.7, label: "Backprop" },
  { angle: 2.0, dist: 0.45, label: "RAG" },
  { angle: 3.3, dist: 0.65, label: "Transformers" },
  { angle: 4.8, dist: 0.5, label: "Embeddings" },
];

export function SearchRadarVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 16;

    let t = 0;

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Concentric rings
      for (let r = 1; r <= 4; r++) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (R * r) / 4, 0, Math.PI * 2);
        ctx!.strokeStyle = "rgba(0,212,255,0.08)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Cross-hairs
      ctx!.strokeStyle = "rgba(0,212,255,0.06)";
      ctx!.beginPath();
      ctx!.moveTo(cx - R, cy);
      ctx!.lineTo(cx + R, cy);
      ctx!.moveTo(cx, cy - R);
      ctx!.lineTo(cx, cy + R);
      ctx!.stroke();

      // Sweep
      const sweep = ((t * 0.012) % (Math.PI * 2));
      const grad = (() => {
        const g = ctx!.createLinearGradient(cx, cy, cx + R, cy);
        g.addColorStop(0, "rgba(0,212,255,0.25)");
        g.addColorStop(1, "transparent");
        return g;
      })();

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(sweep);
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      ctx!.arc(0, 0, R, 0, Math.PI * 0.5);
      ctx!.closePath();
      ctx!.fillStyle = "rgba(0,212,255,0.07)";
      ctx!.fill();
      // Sweep line
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      ctx!.lineTo(R, 0);
      ctx!.strokeStyle = "rgba(0,212,255,0.6)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();
      ctx!.restore();

      // Source pings
      for (const src of SOURCES) {
        const x = cx + src.dist * R * Math.cos(src.angle);
        const y = cy + src.dist * R * Math.sin(src.angle);
        const pingPhase = ((sweep - src.angle + Math.PI * 2) % (Math.PI * 2));
        const alpha = pingPhase < 0.5 ? 1 - pingPhase * 0.4 : Math.max(0, 1 - pingPhase * 0.1);

        ctx!.beginPath();
        ctx!.arc(x, y, 4, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0,212,255,${alpha})`;
        ctx!.fill();

        // Ripple
        const rippleR = 4 + pingPhase * 12;
        ctx!.beginPath();
        ctx!.arc(x, y, rippleR, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(0,212,255,${Math.max(0, 0.4 - pingPhase * 0.06)})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        if (pingPhase < 0.8) {
          ctx!.font = `8px var(--font-inter, system-ui)`;
          ctx!.fillStyle = `rgba(148,163,184,${alpha * 0.8})`;
          ctx!.textAlign = x > cx ? "left" : "right";
          ctx!.fillText(src.label, x + (x > cx ? 8 : -8), y);
        }
      }

      // Centre dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = "#00e5ff";
      ctx!.fill();

      t += 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="rounded-xl bg-panel border border-panel-border p-4 flex flex-col items-center">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-3 self-start">
        Search Radar — Demo Retrieval Layer
      </p>
      <canvas ref={canvasRef} width={220} height={220} aria-label="Search radar visualisation" />
      <p className="text-[10px] text-muted mt-2 text-center">
        Local demo knowledge · No live web search configured
      </p>
    </div>
  );
}
