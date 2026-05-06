"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide ambient neural background.
 *
 * Renders a single fixed-position <canvas> that draws drifting organic
 * neurons (soma + dendrites) with traveling synaptic pulses. Designed
 * to feel alive without distracting — low alpha, slow motion.
 *
 * Variants:
 *   "hero"    — strongest density / brightness (homepage)
 *   "default" — quieter ambient version (inner pages)
 *
 * Performance:
 *   - Single canvas, single rAF loop.
 *   - DPR-aware sizing capped at 1.75 to avoid GPU spikes on retina.
 *   - Pauses while the tab is hidden.
 *   - Honours prefers-reduced-motion (renders one static frame).
 *   - All geometry is precomputed; per-frame work is just stroke + draw.
 */

interface Neuron {
  x: number;
  y: number;
  /** drift velocity */
  vx: number;
  vy: number;
  /** soma radius */
  r: number;
  color: string;
  dendrites: Dendrite[];
  pulsePhase: number;
}

interface Dendrite {
  /** end-point angle from soma centre */
  angle: number;
  /** end-point radius (length of dendrite) */
  length: number;
  /** mid-point control offset for organic curve */
  curve: number;
  /** sub-branches */
  branches: { angle: number; length: number }[];
  /** travelling pulse position [0..1] */
  pulse: number;
  pulseSpeed: number;
}

const PALETTE = ["#00e5ff", "#9d7aff", "#7c5ccc", "#00b3cc"];

function makeNeuron(w: number, h: number, seed: number): Neuron {
  // Deterministic-ish placement based on seed for consistent layout
  const rnd = (k: number) => {
    const x = Math.sin(seed * 9301 + k * 49297) * 233280;
    return x - Math.floor(x);
  };
  const dendCount = 5 + Math.floor(rnd(1) * 4);
  const dendrites: Dendrite[] = [];
  for (let i = 0; i < dendCount; i++) {
    const angle = (i / dendCount) * Math.PI * 2 + rnd(2 + i) * 0.7;
    const length = 60 + rnd(3 + i) * 110;
    const branchCount = Math.floor(rnd(7 + i) * 3);
    const branches = Array.from({ length: branchCount }, (_, k) => ({
      angle: angle + (rnd(11 + i + k) - 0.5) * 0.9,
      length: length * (0.35 + rnd(13 + i + k) * 0.4),
    }));
    dendrites.push({
      angle,
      length,
      curve: (rnd(17 + i) - 0.5) * 0.55,
      branches,
      pulse: rnd(19 + i),
      pulseSpeed: 0.0018 + rnd(23 + i) * 0.0028,
    });
  }
  return {
    x: rnd(31) * w,
    y: rnd(37) * h,
    vx: (rnd(41) - 0.5) * 0.08,
    vy: (rnd(43) - 0.5) * 0.08,
    r: 4 + rnd(47) * 4,
    color: PALETTE[Math.floor(rnd(53) * PALETTE.length)] ?? "#00e5ff",
    dendrites,
    pulsePhase: rnd(59),
  };
}

export function NeuralBackground({
  variant = "default",
  className,
}: {
  variant?: "hero" | "default";
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const neuronsRef = useRef<Neuron[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const wrapEl = wrapRef.current;
    const canvasEl = canvasRef.current;
    if (!wrapEl || !canvasEl) return;
    const ctxRaw = canvasEl.getContext("2d");
    if (!ctxRaw) return;
    const wrap = wrapEl;
    const canvas = canvasEl;
    const ctx = ctxRaw;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const HERO = variant === "hero";
    // Density tuned per area; capped to avoid huge counts on ultrawide screens
    const density = HERO ? 0.000065 : 0.000035;
    const baseAlpha = HERO ? 1 : 0.55;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.height));
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(
        HERO ? 16 : 10,
        Math.max(5, Math.floor(w * h * density))
      );
      neuronsRef.current = Array.from({ length: target }, (_, i) =>
        makeNeuron(w, h, i + 1)
      );
    }

    let tick = 0;
    let visible = true;

    function drawNeuron(n: Neuron) {
      const { x, y, r, color, dendrites } = n;

      // Dendrites with travelling pulses
      for (const d of dendrites) {
        const ex = x + Math.cos(d.angle) * d.length;
        const ey = y + Math.sin(d.angle) * d.length;
        const nx = -Math.sin(d.angle);
        const ny = Math.cos(d.angle);
        const cx = (x + ex) / 2 + nx * d.length * d.curve;
        const cy = (y + ey) / 2 + ny * d.length * d.curve;

        // Main dendrite stroke
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.strokeStyle = color + (HERO ? "1a" : "10");
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Sub-branches
        for (const b of d.branches) {
          const bex = ex + Math.cos(b.angle) * b.length;
          const bey = ey + Math.sin(b.angle) * b.length;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(bex, bey);
          ctx.strokeStyle = color + (HERO ? "12" : "0a");
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Synaptic terminal glow
          ctx.beginPath();
          ctx.arc(bex, bey, 1.1, 0, Math.PI * 2);
          ctx.fillStyle = color + "40";
          ctx.fill();
        }

        // Travelling pulse (quadratic bezier sampled at d.pulse)
        const t = d.pulse;
        const u = 1 - t;
        const px = u * u * x + 2 * u * t * cx + t * t * ex;
        const py = u * u * y + 2 * u * t * cy + t * t * ey;
        ctx.beginPath();
        ctx.arc(px, py, HERO ? 1.7 : 1.2, 0, Math.PI * 2);
        ctx.fillStyle = color + (HERO ? "cc" : "80");
        ctx.fill();
      }

      // Soma — radial gradient
      const pulse =
        0.85 +
        0.15 * Math.sin(tick * 0.012 + n.pulsePhase * Math.PI * 2);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      grd.addColorStop(0, color + "55");
      grd.addColorStop(0.45, color + "12");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = color + "dd";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    function draw() {
      const { w, h } = sizeRef.current;
      ctx.globalAlpha = baseAlpha;
      ctx.clearRect(0, 0, w, h);

      for (const n of neuronsRef.current) {
        // Slow drift, wrap edges
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -200) n.x = w + 200;
        if (n.x > w + 200) n.x = -200;
        if (n.y < -200) n.y = h + 200;
        if (n.y > h + 200) n.y = -200;

        // Pulse advance
        for (const d of n.dendrites) {
          d.pulse += d.pulseSpeed;
          if (d.pulse > 1) d.pulse = 0;
        }

        drawNeuron(n);
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!visible) return;
      tick++;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    function onVisibility() {
      visible = !document.hidden;
      if (visible) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(rafRef.current);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      // Single static frame — no animation loop
      draw();
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    >
      {/* Layered ambient gradients for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 18% 25%, rgba(0,229,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(157,122,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 100% 40% at 50% 110%, rgba(0,229,160,0.04) 0%, transparent 60%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Vignette to keep text readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 40%, rgba(4,5,10,0.55) 100%)",
        }}
      />
    </div>
  );
}
