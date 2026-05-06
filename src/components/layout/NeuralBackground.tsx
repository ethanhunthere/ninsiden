"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient neural background — lightweight, biologically inspired.
 *
 * Design priorities (in order):
 *   1. Never block scrolling — frame budget ≤ 6ms
 *   2. Visually clear — neurons are visible at a glance
 *   3. Biological feel — sway, pulses, drift
 *
 * Architecture:
 *   • 10 neurons (default) / 15 (hero) — enough to fill, not saturate
 *   • Each neuron: soma + 5-6 dendrites, max 2 recursive levels
 *   • Draw passes: single stroke per branch (no per-frame gradient creation)
 *   • Soma: ONE radial gradient created ONCE at build time, cached as
 *     an offscreen mini-canvas — just composited each frame (zero JS alloc)
 *   • Sway: analytic sin(), no geometry rebuild
 *   • 30 fps cap via frame-skip to halve GPU load on slow machines
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatBranch {
  bx: number; by: number;
  tx: number; ty: number;
  nx: number; ny: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  lineWidth: number;
  glowColor: string;
  bodyColor: string;
  spines: [number, number, number][];
  pulse: number;
  pulseSpeed: number;
  depth: number;
  children: FlatBranch[];
}

interface AmbNeuron {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  cr: number; cg: number; cb: number;
  branches: FlatBranch[];
  somaPhase: number;
  somaCanvas: HTMLCanvasElement;
  somaHalf: number;
  axon: { tx: number; ty: number; nx: number; ny: number } | null;
}

// ─── Deterministic RNG ────────────────────────────────────────────────────────

function rng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Hex → RGB ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const COLORS = [
  "#9d7aff", "#9d7aff", "#9d7aff",
  "#00e5ff", "#00e5ff",
  "#b490ff",
  "#7ab8ff",
  "#00e5a0",
];

// ─── Build branch (recursive) ─────────────────────────────────────────────────

function buildBranch(
  bx: number, by: number,
  angle: number, length: number,
  depth: number, maxDepth: number,
  cr: number, cg: number, cb: number,
  rand: () => number
): FlatBranch {
  const tx = bx + Math.cos(angle) * length;
  const ty = by + Math.sin(angle) * length;
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  const swayAmp = (depth + 1) * (2.5 + rand() * 2.0);
  const alpha = Math.max(0.22, 0.78 - depth * 0.15);
  const glowAlpha = Math.max(0.04, 0.12 - depth * 0.02);
  const lw = Math.max(0.35, 1.8 - depth * 0.35);

  const spines: [number, number, number][] = [];
  if (depth >= 2) {
    const count = Math.floor(2 + rand() * 4);
    for (let i = 0; i < count; i++) {
      spines.push([0.05 + rand() * 0.88, rand() > 0.5 ? 1 : -1, 2 + rand() * 3.5]);
    }
  }

  const branch: FlatBranch = {
    bx, by, tx, ty, nx, ny,
    swayAmp,
    swayFreq: 0.007 + rand() * 0.008,
    swayPhase: rand() * Math.PI * 2,
    lineWidth: lw,
    glowColor: `rgba(${cr},${cg},${cb},${glowAlpha.toFixed(2)})`,
    bodyColor: `rgba(${cr},${cg},${cb},${alpha.toFixed(2)})`,
    spines,
    pulse: rand() < 0.25 ? rand() : -1,
    pulseSpeed: 0.003 + rand() * 0.004,
    depth,
    children: [],
  };

  if (depth < maxDepth && length > 12) {
    const childCount = rand() < 0.25 ? 1 : 2;
    const spread = 0.4 + rand() * 0.4;
    const childLen = length * (0.58 + rand() * 0.18);
    for (let i = 0; i < childCount; i++) {
      const tDist = childCount === 1 ? 0 : i === 0 ? -1 : 1;
      const childAngle = angle + tDist * spread + (rand() - 0.5) * 0.25;
      branch.children.push(
        buildBranch(tx, ty, childAngle, childLen, depth + 1, maxDepth,
          cr, cg, cb, rng(Math.floor(rand() * 99999)))
      );
    }
  }

  return branch;
}

// ─── Pre-render soma to offscreen canvas ─────────────────────────────────────

function buildSomaCanvas(r: number, cr: number, cg: number, cb: number): HTMLCanvasElement {
  const half = Math.ceil(r * 5.5);
  const size = half * 2;
  const oc = document.createElement("canvas");
  oc.width = size;
  oc.height = size;
  const c = oc.getContext("2d")!;
  const cx = half, cy = half;

  const halo = c.createRadialGradient(cx, cy, 0, cx, cy, r * 5);
  halo.addColorStop(0, `rgba(${cr},${cg},${cb},0.28)`);
  halo.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.08)`);
  halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  c.fillStyle = halo;
  c.beginPath();
  c.arc(cx, cy, r * 5, 0, Math.PI * 2);
  c.fill();

  const body = c.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx, cy, r * 1.1);
  body.addColorStop(0, `rgba(${cr},${cg},${cb},1)`);
  body.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.7)`);
  body.addColorStop(0.85, `rgba(${cr},${cg},${cb},0.2)`);
  body.addColorStop(1, `rgba(${cr},${cg},${cb},0.05)`);
  c.fillStyle = body;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "rgba(6,4,18,0.92)";
  c.beginPath();
  c.arc(cx + r * 0.06, cy + r * 0.08, r * 0.44, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = `rgba(${cr},${cg},${cb},0.95)`;
  c.beginPath();
  c.arc(cx - r * 0.15, cy - r * 0.05, r * 0.19, 0, Math.PI * 2);
  c.fill();

  const hl = c.createRadialGradient(cx - r * 0.38, cy - r * 0.44, 0, cx - r * 0.38, cy - r * 0.44, r * 0.42);
  hl.addColorStop(0, "rgba(255,255,255,0.38)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = hl;
  c.beginPath();
  c.arc(cx - r * 0.38, cy - r * 0.44, r * 0.42, 0, Math.PI * 2);
  c.fill();

  return oc;
}

// ─── Build full neuron ────────────────────────────────────────────────────────

function buildNeuron(seed: number, w: number, h: number): AmbNeuron {
  const rand = rng(seed);

  const color = COLORS[Math.floor(rand() * COLORS.length)] ?? "#9d7aff";
  const [cr, cg, cb] = hexToRgb(color);
  const r = 5 + rand() * 6;

  const dendCount = 5 + Math.floor(rand() * 3);
  const baseAngle = rand() * Math.PI * 2;
  const maxDepth = 1 + Math.floor(rand() * 2);

  const branches: FlatBranch[] = [];
  for (let i = 0; i < dendCount; i++) {
    const angle = baseAngle + (i / dendCount) * Math.PI * 2 + (rand() - 0.5) * 0.45;
    const length = 32 + rand() * 52;
    branches.push(
      buildBranch(
        Math.cos(angle) * r * 0.85,
        Math.sin(angle) * r * 0.85,
        angle, length, 0, maxDepth, cr, cg, cb,
        rng(seed * 31 + i * 113)
      )
    );
  }

  const axAngle = baseAngle + Math.PI * (0.45 + rand() * 0.55);
  const axLen = 55 + rand() * 70;
  const axon = {
    tx: Math.cos(axAngle) * (r + axLen),
    ty: Math.sin(axAngle) * (r + axLen),
    nx: -Math.sin(axAngle),
    ny: Math.cos(axAngle),
  };

  const speed = 0.05 + rand() * 0.07;
  const driftAngle = rand() * Math.PI * 2;

  const somaCanvas = buildSomaCanvas(r, cr, cg, cb);
  const somaHalf = Math.ceil(r * 5.5);

  return {
    x: rand() * w,
    y: rand() * h,
    vx: Math.cos(driftAngle) * speed,
    vy: Math.sin(driftAngle) * speed,
    r,
    color,
    cr, cg, cb,
    branches,
    somaPhase: rand() * Math.PI * 2,
    somaCanvas,
    somaHalf,
    axon,
  };
}

// ─── Draw a branch and its subtree ───────────────────────────────────────────

function drawBranch(
  b: FlatBranch,
  accDx: number, accDy: number,
  tick: number,
  ctx: CanvasRenderingContext2D,
  cr: number, cg: number, cb: number
): void {
  const ownSway = Math.sin(tick * b.swayFreq + b.swayPhase) * b.swayAmp;
  const sx = b.nx * ownSway;
  const sy = b.ny * ownSway;

  const bx = b.bx + accDx;
  const by = b.by + accDy;
  const tx = b.tx + accDx + sx;
  const ty = b.ty + accDy + sy;

  ctx.strokeStyle = b.glowColor;
  ctx.lineWidth = b.lineWidth * 4.5;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.strokeStyle = b.bodyColor;
  ctx.lineWidth = b.lineWidth;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  if (b.spines.length > 0) {
    const dx = tx - bx, dy = ty - by;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const pnx = -uy, pny = ux;
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.5)`;
    ctx.lineWidth = 0.5;
    for (const [t, side, slen] of b.spines) {
      const spx = bx + dx * t;
      const spy = by + dy * t;
      const epx = spx + pnx * side * slen;
      const epy = spy + pny * side * slen;
      ctx.beginPath();
      ctx.moveTo(spx, spy);
      ctx.lineTo(epx, epy);
      ctx.stroke();
      ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`;
      ctx.beginPath();
      ctx.arc(epx, epy, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (b.pulse >= 0) {
    const px = bx + (tx - bx) * b.pulse;
    const py = by + (ty - by) * b.pulse;
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.25)`;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const newAccDx = accDx + sx;
  const newAccDy = accDy + sy;
  for (const child of b.children) {
    drawBranch(child, newAccDx, newAccDy, tick, ctx, cr, cg, cb);
  }
}

// ─── Advance pulses ───────────────────────────────────────────────────────────

function tickBranches(branches: FlatBranch[]): void {
  for (const b of branches) {
    if (b.pulse >= 0) {
      b.pulse += b.pulseSpeed;
      if (b.pulse > 1) b.pulse = Math.random() < 0.3 ? 0 : -1;
    } else if (Math.random() < 0.0015) {
      b.pulse = 0;
    }
    if (b.children.length > 0) tickBranches(b.children);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const neuronsRef = useRef<AmbNeuron[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });

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
    const COUNT = HERO ? 15 : 10;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.height));
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Build neurons with final size so positions are distributed across canvas
      neuronsRef.current = Array.from({ length: COUNT }, (_, i) =>
        buildNeuron(i * 1777 + 53, w, h)
      );
    }

    let tick = 0;
    let frame = 0;
    let visible = true;

    function draw() {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const neurons = neuronsRef.current;

      ctx.globalCompositeOperation = "lighter";

      for (const n of neurons) {
        ctx.save();
        ctx.translate(n.x, n.y);

        for (const b of n.branches) {
          drawBranch(b, 0, 0, tick, ctx, n.cr, n.cg, n.cb);
        }

        if (n.axon) {
          const axSway = Math.sin(tick * 0.005 + n.somaPhase) * 8;
          const aex = n.axon.tx + n.axon.nx * axSway;
          const aey = n.axon.ty + n.axon.ny * axSway;
          ctx.strokeStyle = `rgba(${n.cr},${n.cg},${n.cb},0.18)`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(aex, aey);
          ctx.stroke();
          ctx.fillStyle = `rgba(${n.cr},${n.cg},${n.cb},0.5)`;
          ctx.beginPath();
          ctx.arc(aex, aey, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
      for (const n of neurons) {
        const breathe = 1 + 0.05 * Math.sin(tick * 0.017 + n.somaPhase);
        const half = n.somaHalf;
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.scale(breathe, breathe);
        ctx.drawImage(n.somaCanvas, -half, -half, half * 2, half * 2);
        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
    }

    function advance() {
      const { w, h } = sizeRef.current;
      for (const n of neuronsRef.current) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -180) n.x = w + 180;
        if (n.x > w + 180) n.x = -180;
        if (n.y < -180) n.y = h + 180;
        if (n.y > h + 180) n.y = -180;
        tickBranches(n.branches);
      }
    }

    function loop() {
      if (!visible) return;
      tick++;
      frame++;
      // Run advance + draw every other frame (≈30fps) to keep page snappy
      if (frame % 2 === 0) {
        advance();
        draw();
      }
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
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 55% 40% at 15% 22%, rgba(0,229,255,0.06) 0%, transparent 60%)",
            "radial-gradient(ellipse 50% 45% at 85% 78%, rgba(157,122,255,0.08) 0%, transparent 55%)",
            "radial-gradient(ellipse 65% 30% at 50% 105%, rgba(0,229,160,0.04) 0%, transparent 55%)",
          ].join(", "),
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 115% 90% at 50% 50%, transparent 45%, rgba(4,5,10,0.5) 100%)",
        }}
      />
    </div>
  );
}
