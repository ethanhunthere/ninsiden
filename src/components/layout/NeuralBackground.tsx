"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide ambient neural background — full biologically realistic field.
 *
 * 20-28 drifting neurons, each with:
 *   • Recursive dendritic tree (3-4 levels, bifurcating)
 *   • Dendritic spines on second-order+ branches
 *   • Branch sway — perpendicular oscillation, cumulative parent→child
 *   • Soma breathing — radius pulses ±5%
 *   • Action potential pulses traveling dendrites
 *   • Synaptic connections + traveling pulse between nearby neurons
 *   • Slow drift; wraps at canvas edges
 *
 * All branch positions are soma-relative (origin = soma centre).
 * At draw time we translate(n.x, n.y) for zero per-frame allocation.
 *
 * DPR capped 1.75 | ResizeObserver | visibilitychange pause | reduced-motion.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Single spine: a short perpendicular stub with a tiny head. */
interface Spine {
  t: number;   // position along branch segment [0..1]
  side: number; // +1 or -1
  len: number;  // length in px
}

/** A branch segment in soma-relative coordinates. */
interface ABranch {
  restBx: number;  // rest base x (soma-relative)
  restBy: number;
  restTx: number;  // rest tip x (soma-relative)
  restTy: number;
  /** perpendicular unit vector for sway */
  nx: number;
  ny: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  lineWidth: number;
  depth: number;
  spines: Spine[];
  /** Pulse traveling this branch: [0..1] or -1 (inactive) */
  pulse: number;
  pulseSpeed: number;
  children: ABranch[];
}

interface AmbNeuron {
  x: number;       // soma world position (drifts)
  y: number;
  vx: number;      // drift velocity
  vy: number;
  r: number;       // soma rest radius
  color: string;   // "#rrggbb"
  branches: ABranch[];
  somaPhase: number;
  axonEnd: { x: number; y: number } | null;  // soma-relative axon tip
}

/** Pair of neurons close enough to form a visible synaptic connection. */
interface SynPair {
  a: number;   // index into neurons[]
  b: number;
  pulse: number;  // [0..1]
  speed: number;
}

// ─── Deterministic RNG ────────────────────────────────────────────────────────

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const COLORS = [
  "#9d7aff", // violet  (45%)
  "#9d7aff",
  "#00e5ff", // cyan    (35%)
  "#00e5ff",
  "#00e5ff",
  "#b48aff", // soft violet
  "#7ab8ff", // ice blue
  "#ff72c0", // pink magenta (10%)
  "#00e5a0", // green   (10%)
];

// ─── Build helpers ────────────────────────────────────────────────────────────

function buildSpines(
  bx: number, by: number, tx: number, ty: number,
  depth: number, rand: () => number
): Spine[] {
  if (depth < 2) return [];
  const spines: Spine[] = [];
  const count = Math.floor(3 + rand() * 6);
  for (let i = 0; i < count; i++) {
    spines.push({
      t: 0.05 + rand() * 0.9,
      side: rand() > 0.5 ? 1 : -1,
      len: 2.5 + rand() * 4,
    });
  }
  return spines;
}

function buildBranch(
  bx: number, by: number,
  angle: number, length: number,
  depth: number, maxDepth: number,
  rand: () => number
): ABranch {
  const tx = bx + Math.cos(angle) * length;
  const ty = by + Math.sin(angle) * length;
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);

  // Sway amplitude grows with depth (distal branches sway more)
  const swayAmp = (depth + 1) * (1.5 + rand() * 1.5);

  const branch: ABranch = {
    restBx: bx, restBy: by,
    restTx: tx, restTy: ty,
    nx, ny,
    swayAmp,
    swayFreq: 0.008 + rand() * 0.009,
    swayPhase: rand() * Math.PI * 2,
    lineWidth: Math.max(0.3, 2.0 - depth * 0.38),
    depth,
    spines: buildSpines(bx, by, tx, ty, depth, rand),
    pulse: rand() < 0.3 ? rand() : -1,
    pulseSpeed: 0.002 + rand() * 0.003,
    children: [],
  };

  if (depth < maxDepth && length > 10) {
    const canTerminate = depth >= 2 && rand() < 0.15;
    if (!canTerminate) {
      const childCount = rand() < 0.22 ? 1 : 2;
      const spread = 0.35 + rand() * 0.45;
      const childLen = length * (0.62 + rand() * 0.18);

      for (let i = 0; i < childCount; i++) {
        const tDist = childCount === 1 ? 0 : (i / (childCount - 1)) * 2 - 1;
        const childAngle = angle + tDist * spread + (rand() - 0.5) * 0.3;
        branch.children.push(
          buildBranch(tx, ty, childAngle, childLen, depth + 1, maxDepth, rand)
        );
      }
    }
  }

  return branch;
}

function buildAmbNeuron(
  wx: number, wy: number,
  ww: number, wh: number,
  seed: number
): AmbNeuron {
  const rand = rng(seed);

  const r = 4 + rand() * 6;   // soma radius
  const color = COLORS[Math.floor(rand() * COLORS.length)] ?? "#9d7aff";

  // Speed: very slow drift
  const speed = 0.04 + rand() * 0.06;
  const driftAngle = rand() * Math.PI * 2;
  const vx = Math.cos(driftAngle) * speed;
  const vy = Math.sin(driftAngle) * speed;

  // First-order dendrites (5-8, radiating outward from soma)
  const dendCount = 5 + Math.floor(rand() * 4);
  const branches: ABranch[] = [];
  const baseAngleOffset = rand() * Math.PI * 2;

  for (let i = 0; i < dendCount; i++) {
    const angle = baseAngleOffset + (i / dendCount) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const length = 35 + rand() * 55;
    const maxDepth = 2 + Math.floor(rand() * 2);
    branches.push(buildBranch(
      Math.cos(angle) * r * 0.9,
      Math.sin(angle) * r * 0.9,
      angle, length, 0, maxDepth, rng(seed * 13 + i * 97)
    ));
  }

  // Axon: a single long thin process
  const axonAngle = baseAngleOffset + Math.PI * (0.5 + rand() * 0.4);
  const axonLen = 60 + rand() * 80;
  const axonEnd = {
    x: Math.cos(axonAngle) * (r + axonLen),
    y: Math.sin(axonAngle) * (r + axonLen),
  };

  return {
    x: wx,
    y: wy,
    vx,
    vy,
    r,
    color,
    branches,
    somaPhase: rand() * Math.PI * 2,
    axonEnd,
  };
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

/**
 * Draw one branch (and its whole subtree), accumulating parent sway.
 * `accDx/Dy` = total world displacement from all parent branches.
 */
function drawBranch(
  b: ABranch,
  accDx: number, accDy: number,
  tick: number,
  ctx: CanvasRenderingContext2D,
  color: string,
  baseAlpha: number
): void {
  // Base world position = rest base + accumulated parent sway
  const bx = b.restBx + accDx;
  const by = b.restBy + accDy;

  // Own sway at the TIP
  const ownSway = Math.sin(tick * b.swayFreq + b.swayPhase) * b.swayAmp;
  const swayDx = b.nx * ownSway;
  const swayDy = b.ny * ownSway;

  // Tip world position
  const tx = b.restTx + accDx + swayDx;
  const ty = b.restTy + accDy + swayDy;

  // Depth fade (distal branches dimmer)
  const depthAlpha = Math.max(0.25, 1 - b.depth * 0.18) * baseAlpha;

  // Outer glow stroke
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = color + Math.round(depthAlpha * 40).toString(16).padStart(2, "0");
  ctx.lineWidth = b.lineWidth * 4;
  ctx.lineCap = "round";
  ctx.stroke();

  // Main body stroke
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = color + Math.round(depthAlpha * 170).toString(16).padStart(2, "0");
  ctx.lineWidth = b.lineWidth;
  ctx.stroke();

  // Dendritic spines
  if (b.spines.length > 0) {
    const dx = tx - bx;
    const dy = ty - by;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const pnx = -uy; // perpendicular
    const pny = ux;

    for (const sp of b.spines) {
      const sx = bx + dx * sp.t;
      const sy = by + dy * sp.t;
      const sex = sx + pnx * sp.side * sp.len;
      const sey = sy + pny * sp.side * sp.len;
      // Spine shaft
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sex, sey);
      ctx.strokeStyle = color + Math.round(depthAlpha * 130).toString(16).padStart(2, "0");
      ctx.lineWidth = 0.45;
      ctx.stroke();
      // Spine head (tiny bulb)
      ctx.beginPath();
      ctx.arc(sex, sey, 0.7 + sp.len * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = color + Math.round(depthAlpha * 200).toString(16).padStart(2, "0");
      ctx.fill();
    }
  }

  // Pulse bead traveling this branch
  if (b.pulse >= 0) {
    const px = bx + (tx - bx) * b.pulse;
    const py = by + (ty - by) * b.pulse;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 5);
    grad.addColorStop(0, color + "ff");
    grad.addColorStop(0.4, color + "88");
    grad.addColorStop(1, color + "00");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Recurse into children — they start at our actual swayed tip
  const newAccDx = accDx + swayDx;
  const newAccDy = accDy + swayDy;
  for (const child of b.children) {
    drawBranch(child, newAccDx, newAccDy, tick, ctx, color, baseAlpha);
  }
}

function drawSoma(
  n: AmbNeuron,
  tick: number,
  ctx: CanvasRenderingContext2D,
  baseAlpha: number
): void {
  const breathe = 1 + 0.055 * Math.sin(tick * 0.018 + n.somaPhase);
  const r = n.r * breathe;
  const col = n.color;

  // Outer bloom halo
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 5);
  halo.addColorStop(0, col + Math.round(baseAlpha * 80).toString(16).padStart(2, "0"));
  halo.addColorStop(0.5, col + Math.round(baseAlpha * 30).toString(16).padStart(2, "0"));
  halo.addColorStop(1, col + "00");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 5, 0, Math.PI * 2);
  ctx.fill();

  // Main soma fill
  const soma = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 0, 0, 0, r * 1.1);
  soma.addColorStop(0, col + "ee");
  soma.addColorStop(0.4, col + "99");
  soma.addColorStop(0.8, col + "44");
  soma.addColorStop(1, col + "11");
  ctx.fillStyle = soma;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim
  ctx.strokeStyle = col + Math.round(baseAlpha * 200).toString(16).padStart(2, "0");
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Nucleus
  const nr = r * 0.42;
  const nucGrad = ctx.createRadialGradient(-nr * 0.2, -nr * 0.2, 0, 0, 0, nr);
  nucGrad.addColorStop(0, "rgba(15, 8, 40, 0.95)");
  nucGrad.addColorStop(1, "rgba(4, 2, 18, 0.98)");
  ctx.fillStyle = nucGrad;
  ctx.beginPath();
  ctx.arc(0, nr * 0.1, nr, 0, Math.PI * 2);
  ctx.fill();

  // Nucleolus
  ctx.fillStyle = col + "cc";
  ctx.beginPath();
  ctx.arc(-nr * 0.2, -nr * 0.05, nr * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight
  const hl = ctx.createRadialGradient(-r * 0.35, -r * 0.42, 0, -r * 0.35, -r * 0.42, r * 0.48);
  hl.addColorStop(0, "rgba(255,255,255,0.45)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.42, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Pulse advancement ────────────────────────────────────────────────────────

function advancePulses(branches: ABranch[]): void {
  for (const b of branches) {
    if (b.pulse >= 0) {
      b.pulse += b.pulseSpeed;
      if (b.pulse > 1) b.pulse = Math.random() < 0.35 ? 0 : -1;
    } else if (Math.random() < 0.0008) {
      b.pulse = 0;
    }
    advancePulses(b.children);
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
  const synPairsRef = useRef<SynPair[]>([]);
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
    // More neurons for hero, slightly fewer for ambient pages
    const TARGET_COUNT = HERO ? 28 : 20;
    const BASE_ALPHA = HERO ? 0.9 : 0.55;
    const CONNECTION_RANGE = 220;

    function rebuild(w: number, h: number) {
      const neurons: AmbNeuron[] = [];
      for (let i = 0; i < TARGET_COUNT; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        neurons.push(buildAmbNeuron(x, y, w, h, i * 1337 + 42));
      }
      neuronsRef.current = neurons;

      // Find close pairs for synaptic connections
      const pairs: SynPair[] = [];
      for (let a = 0; a < neurons.length; a++) {
        for (let b = a + 1; b < neurons.length; b++) {
          const na = neurons[a];
          const nb = neurons[b];
          if (!na || !nb) continue;
          const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
          if (dist < CONNECTION_RANGE) {
            pairs.push({ a, b, pulse: Math.random(), speed: 0.001 + Math.random() * 0.002 });
          }
        }
      }
      synPairsRef.current = pairs;
    }

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
      rebuild(w, h);
    }

    let tick = 0;
    let visible = true;

    function draw() {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      const neurons = neuronsRef.current;

      // Drift neurons
      if (!reduceMotion) {
        for (const n of neurons) {
          n.x += n.vx;
          n.y += n.vy;
          // Wrap at edges with generous margin
          if (n.x < -250) n.x = w + 250;
          if (n.x > w + 250) n.x = -250;
          if (n.y < -250) n.y = h + 250;
          if (n.y > h + 250) n.y = -250;
        }

        // Advance dendritic pulses
        for (const n of neurons) {
          advancePulses(n.branches);
        }

        // Advance synaptic connection pulses
        for (const p of synPairsRef.current) {
          p.pulse += p.speed;
          if (p.pulse > 1) p.pulse = 0;
        }
      }

      // Draw synaptic connections FIRST (under neurons)
      ctx.globalCompositeOperation = "lighter";
      for (const pair of synPairsRef.current) {
        const na = neurons[pair.a];
        const nb = neurons[pair.b];
        if (!na || !nb) continue;

        const ax = na.axonEnd ? na.x + na.axonEnd.x : na.x;
        const ay = na.axonEnd ? na.y + na.axonEnd.y : na.y;

        // Very subtle connection line
        const lineAlpha = Math.round(BASE_ALPHA * 18).toString(16).padStart(2, "0");
        const grad = ctx.createLinearGradient(ax, ay, nb.x, nb.y);
        grad.addColorStop(0, na.color + lineAlpha);
        grad.addColorStop(1, nb.color + lineAlpha);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Traveling pulse bead along connection
        const px = ax + (nb.x - ax) * pair.pulse;
        const py = ay + (nb.y - ay) * pair.pulse;
        const beadCol = na.color;
        const beadGrad = ctx.createRadialGradient(px, py, 0, px, py, 4);
        beadGrad.addColorStop(0, beadCol + "cc");
        beadGrad.addColorStop(1, beadCol + "00");
        ctx.fillStyle = beadGrad;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw neurons
      for (const n of neurons) {
        ctx.save();
        ctx.translate(n.x, n.y);

        // Draw dendritic branches with additive bloom
        ctx.globalCompositeOperation = "lighter";
        for (const b of n.branches) {
          drawBranch(b, 0, 0, tick, ctx, n.color, BASE_ALPHA);
        }

        // Axon
        if (n.axonEnd) {
          const axAngle = Math.atan2(n.axonEnd.y, n.axonEnd.x);
          const axLen = Math.hypot(n.axonEnd.x, n.axonEnd.y);
          // Slight sway on the axon
          const axSway = Math.sin(tick * 0.006 + n.somaPhase * 0.7) * axLen * 0.04;
          const nx = -Math.sin(axAngle);
          const ny = Math.cos(axAngle);
          const aex = n.axonEnd.x + nx * axSway;
          const aey = n.axonEnd.y + ny * axSway;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(aex, aey);
          const axAlpha = Math.round(BASE_ALPHA * 100).toString(16).padStart(2, "0");
          ctx.strokeStyle = n.color + axAlpha;
          ctx.lineWidth = 0.7;
          ctx.stroke();

          // Axon terminal bouton
          const tbGrad = ctx.createRadialGradient(aex, aey, 0, aex, aey, 5);
          tbGrad.addColorStop(0, n.color + "cc");
          tbGrad.addColorStop(1, n.color + "00");
          ctx.fillStyle = tbGrad;
          ctx.beginPath();
          ctx.arc(aex, aey, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Soma on top in source-over
        ctx.globalCompositeOperation = "source-over";
        drawSoma(n, tick, ctx, BASE_ALPHA);

        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
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
      {/* Deep-space layered ambient gradients */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 60% 40% at 15% 20%, rgba(0,229,255,0.07) 0%, transparent 60%)",
            "radial-gradient(ellipse 55% 45% at 88% 80%, rgba(157,122,255,0.09) 0%, transparent 55%)",
            "radial-gradient(ellipse 70% 30% at 50% 105%, rgba(0,229,160,0.04) 0%, transparent 55%)",
            "radial-gradient(ellipse 40% 60% at 75% 15%, rgba(157,122,255,0.05) 0%, transparent 55%)",
          ].join(", "),
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Vignette to keep content legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 85% at 50% 50%, transparent 35%, rgba(4,5,10,0.6) 100%)",
        }}
      />
    </div>
  );
}
