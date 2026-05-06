"use client";

import { useEffect, useRef } from "react";

/**
 * HeroNeuronCell — photorealistic biological neuron.
 *
 * Renders a single pyramidal-style neuron using:
 *   • Organic perturbed soma (irregular cell body, not a circle)
 *     with internal nucleus + nucleolus + cytoplasmic granularity
 *   • Recursive L-system dendritic arbor with cubic width tapering,
 *     per-segment angle jitter, and ~5 levels of branching
 *   • A long thin axon with a myelinated look + axon hillock
 *   • Fine synaptic boutons (terminal blebs) at every twig tip
 *   • Membrane halo + fluorescence-microscopy bloom
 *   • Slow-travelling action-potential pulses along random dendrites
 *
 * All on a single 2D canvas, DPR-aware, ResizeObserver-driven,
 * pauses on tab hide and on prefers-reduced-motion.
 */

// ─── Geometry types ────────────────────────────────────────────────
interface Segment {
  /** start point in world coords (relative to soma centre) */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** quadratic control */
  cx: number;
  cy: number;
  /** radius at start and end (for tapered stroking via gradient stamp) */
  r0: number;
  r1: number;
  /** depth in the tree (0 = first order) */
  depth: number;
  /** length cached for pulse animation */
  length: number;
  /** colour mix 0..1 → soma side (violet) to tip side (cyan) */
  tipness: number;
}

interface Bouton {
  x: number;
  y: number;
  r: number;
  brightness: number;
}

interface Pulse {
  /** index into segments[] of the path it follows */
  pathIdx: number;
  /** 0..1 along the polyline */
  t: number;
  speed: number;
  intensity: number;
}

// Path = ordered list of segment indices from soma → terminal tip
type Path = number[];

interface SomaPoint {
  x: number;
  y: number;
}

interface BuiltState {
  segments: Segment[];
  boutons: Bouton[];
  paths: Path[];
  pulses: Pulse[];
  soma: SomaPoint[];
  somaCx: number;
  somaCy: number;
  somaR: number;
  axonPath: Path;
  w: number;
  h: number;
}

// Deterministic PRNG so the cell looks the same across reloads on a given size
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

interface Props {
  className?: string;
}

export function HeroNeuronCell({ className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BuiltState | null>(null);
  const rafRef = useRef(0);

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

    // ─── Build neuron geometry ───────────────────────────────────
    function build(w: number, h: number) {
      const cx = w * 0.5;
      const cy = h * 0.55;
      const scale = Math.min(w, h) / 620;
      const somaR = Math.max(30, 52 * scale);
      const rand = rng(1337);

      // Irregular soma outline — perturbed polygon with smoothing
      const SOMA_POINTS = 36;
      const soma: SomaPoint[] = [];
      for (let i = 0; i < SOMA_POINTS; i++) {
        const a = (i / SOMA_POINTS) * Math.PI * 2;
        // multi-octave noise for organic bumpiness
        const n =
          Math.sin(a * 3 + 0.7) * 0.06 +
          Math.sin(a * 5 + 1.4) * 0.04 +
          Math.sin(a * 11 + 2.3) * 0.025 +
          (rand() - 0.5) * 0.02;
        // slight elongation to look pyramidal (more vertical)
        const elong = 1 + Math.cos(a) * 0.06 + Math.sin(a) * -0.05;
        const r = somaR * (1 + n) * elong;
        soma.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }

      const segments: Segment[] = [];
      const boutons: Bouton[] = [];
      const paths: Path[] = [];

      /**
       * Recursive L-system branching.
       * Returns the index of the last segment created (terminal tip).
       */
      function grow(
        startX: number,
        startY: number,
        angle: number,
        length: number,
        thickness: number,
        depth: number,
        maxDepth: number,
        path: Path,
        rnd: () => number
      ): void {
        // Build a slightly curved segment with quadratic control
        const curveSign = rnd() > 0.5 ? 1 : -1;
        const curveAmt = (0.15 + rnd() * 0.25) * curveSign;
        const ex = startX + Math.cos(angle) * length;
        const ey = startY + Math.sin(angle) * length;
        // perpendicular control offset
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        const ctrlX = startX + Math.cos(angle) * length * 0.5 + nx * length * curveAmt;
        const ctrlY = startY + Math.sin(angle) * length * 0.5 + ny * length * curveAmt;

        const r0 = thickness;
        const r1 = Math.max(0.35, thickness * 0.62);
        const tipness = depth / maxDepth;

        const segIdx = segments.length;
        segments.push({
          x0: startX,
          y0: startY,
          x1: ex,
          y1: ey,
          cx: ctrlX,
          cy: ctrlY,
          r0,
          r1,
          depth,
          length,
          tipness,
        });
        path.push(segIdx);

        // Terminal? add bouton + close out path
        if (depth >= maxDepth || length < 6) {
          boutons.push({
            x: ex,
            y: ey,
            r: Math.max(1.6, r1 * 1.4 + rnd() * 1.6),
            brightness: 0.65 + rnd() * 0.35,
          });
          paths.push([...path]);
          path.pop();
          return;
        }

        // Branch — usually 2 children, sometimes 3 (early), sometimes 1 (late)
        const branchRoll = rnd();
        const childCount =
          depth < 2 ? (branchRoll < 0.35 ? 3 : 2) : branchRoll < 0.18 ? 1 : 2;

        const baseSpread = 0.55 + rnd() * 0.35; // total angle spread between children
        const lengthFactor = 0.55 + rnd() * 0.18;

        for (let i = 0; i < childCount; i++) {
          // distribute around continuation angle
          const t =
            childCount === 1 ? 0 : (i / (childCount - 1)) * 2 - 1; // -1..1
          const childAngle =
            angle +
            t * baseSpread +
            (rnd() - 0.5) * 0.25; // jitter
          const childLength =
            length * lengthFactor * (0.85 + rnd() * 0.3);
          const childThickness = r1 * (0.75 + rnd() * 0.18);

          // Inject a tiny mid-bouton (varicosity) every now and then
          if (rnd() < 0.25 && depth >= 2) {
            const midT = 0.55 + rnd() * 0.35;
            const u = 1 - midT;
            const bx =
              u * u * startX +
              2 * u * midT * ctrlX +
              midT * midT * ex;
            const by =
              u * u * startY +
              2 * u * midT * ctrlY +
              midT * midT * ey;
            boutons.push({
              x: bx,
              y: by,
              r: 0.9 + rnd() * 1.2,
              brightness: 0.4 + rnd() * 0.4,
            });
          }

          grow(ex, ey, childAngle, childLength, childThickness, depth + 1, maxDepth, path, rnd);
        }

        path.pop();
      }

      // ─── Pyramidal-style trunk dendrites ──────────────────────
      // Apical dendrite (large, points up)
      const apicalRand = rng(2025);
      grow(
        cx,
        cy - somaR * 0.85,
        -Math.PI / 2 + (apicalRand() - 0.5) * 0.15,
        130 * scale,
        Math.max(2.4, 4.2 * scale),
        0,
        5,
        [],
        apicalRand
      );

      // Basal & lateral dendrites — radiate around the soma
      const BASAL_COUNT = 6;
      for (let i = 0; i < BASAL_COUNT; i++) {
        const baseAngle =
          Math.PI * 0.25 +
          (i / BASAL_COUNT) * Math.PI * 1.5 +
          (rand() - 0.5) * 0.2;
        const startX = cx + Math.cos(baseAngle) * somaR * 0.85;
        const startY = cy + Math.sin(baseAngle) * somaR * 0.85;
        const len = (75 + rand() * 55) * scale;
        const thick = Math.max(1.8, (3.0 + rand() * 0.6) * scale);
        const seedRand = rng(7777 + i * 31);
        grow(startX, startY, baseAngle, len, thick, 0, 4 + (i % 2), [], seedRand);
      }

      // ─── Axon — single long thin process going down-left ──────
      const axonPath: Path = [];
      const axonAngle = Math.PI * 0.62 + (rand() - 0.5) * 0.1; // slightly left of straight down
      const axonRand = rng(99);
      // axon hillock — short stubby start
      let ax = cx + Math.cos(axonAngle) * somaR * 0.95;
      let ay = cy + Math.sin(axonAngle) * somaR * 0.95;
      let aAngle = axonAngle;
      let aThick = Math.max(1.6, 2.4 * scale);
      const AXON_SEGS = 9;
      for (let i = 0; i < AXON_SEGS; i++) {
        const len = (45 + axonRand() * 30) * scale;
        const curveSign = axonRand() > 0.5 ? 1 : -1;
        const curveAmt = (0.08 + axonRand() * 0.12) * curveSign;
        const ex = ax + Math.cos(aAngle) * len;
        const ey = ay + Math.sin(aAngle) * len;
        const nx = -Math.sin(aAngle);
        const ny = Math.cos(aAngle);
        const ctrlX = ax + Math.cos(aAngle) * len * 0.5 + nx * len * curveAmt;
        const ctrlY = ay + Math.sin(aAngle) * len * 0.5 + ny * len * curveAmt;
        const r0 = aThick;
        const r1 = Math.max(0.6, aThick * 0.94);
        const idx = segments.length;
        segments.push({
          x0: ax,
          y0: ay,
          x1: ex,
          y1: ey,
          cx: ctrlX,
          cy: ctrlY,
          r0,
          r1,
          depth: 0,
          length: len,
          tipness: 0.85,
        });
        axonPath.push(idx);
        ax = ex;
        ay = ey;
        aAngle += (axonRand() - 0.5) * 0.35;
        aThick = r1;
      }
      // Axon terminals — small spray
      const TERMINALS = 5;
      for (let i = 0; i < TERMINALS; i++) {
        const tAngle = aAngle + (i / (TERMINALS - 1) - 0.5) * 0.9;
        const tLen = (30 + axonRand() * 25) * scale;
        const ex = ax + Math.cos(tAngle) * tLen;
        const ey = ay + Math.sin(tAngle) * tLen;
        const nx = -Math.sin(tAngle);
        const ny = Math.cos(tAngle);
        const ctrlX = ax + Math.cos(tAngle) * tLen * 0.5 + nx * tLen * 0.15;
        const ctrlY = ay + Math.sin(tAngle) * tLen * 0.5 + ny * tLen * 0.15;
        segments.push({
          x0: ax,
          y0: ay,
          x1: ex,
          y1: ey,
          cx: ctrlX,
          cy: ctrlY,
          r0: aThick,
          r1: Math.max(0.5, aThick * 0.7),
          depth: 0,
          length: tLen,
          tipness: 0.9,
        });
        boutons.push({
          x: ex,
          y: ey,
          r: 1.6 + axonRand() * 1.2,
          brightness: 0.85,
        });
      }

      // ─── Pulses — pick a few paths to send action potentials down ─
      const pulses: Pulse[] = [];
      const PULSE_COUNT = Math.min(6, paths.length);
      const pulseRand = rng(555);
      for (let i = 0; i < PULSE_COUNT; i++) {
        pulses.push({
          pathIdx: Math.floor(pulseRand() * paths.length),
          t: pulseRand(),
          speed: 0.0015 + pulseRand() * 0.0025,
          intensity: 0.6 + pulseRand() * 0.4,
        });
      }

      stateRef.current = {
        segments,
        boutons,
        paths,
        pulses,
        soma,
        somaCx: cx,
        somaCy: cy,
        somaR,
        axonPath,
        w,
        h,
      };
    }

    // ─── Resize ──────────────────────────────────────────────────
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(280, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(w, h);
    }

    // ─── Quadratic bezier sampler ────────────────────────────────
    function quadPoint(t: number, p0: number, p1: number, p2: number) {
      const u = 1 - t;
      return u * u * p0 + 2 * u * t * p1 + t * t * p2;
    }

    // ─── Sample point + tangent direction along a multi-segment path
    function samplePath(path: Path, t: number, segs: Segment[]) {
      // approximate by uniform t across segment count
      const total = path.length;
      const f = t * total;
      const i = Math.min(total - 1, Math.floor(f));
      const localT = f - i;
      const idx = path[i];
      if (idx === undefined) return null;
      const s = segs[idx];
      if (!s) return null;
      const x = quadPoint(localT, s.x0, s.cx, s.x1);
      const y = quadPoint(localT, s.y0, s.cy, s.y1);
      return { x, y };
    }

    // ─── Draw a single tapered curved segment ────────────────────
    function drawSegment(s: Segment, alphaMul: number) {
      // Fluorescence-microscopy palette: deeper violet near soma → bright cyan-magenta at tips
      const startCol = `rgba(190, 130, 255, ${0.85 * alphaMul})`;
      const endCol = `rgba(${Math.round(120 + s.tipness * 80)}, ${Math.round(
        200 + s.tipness * 55
      )}, 255, ${(0.7 + s.tipness * 0.25) * alphaMul})`;

      // Outer glow stroke (wider, very transparent)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(157, 122, 255, ${0.18 * alphaMul})`;
      ctx.lineWidth = (s.r0 + s.r1) * 1.6 + 2;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1);
      ctx.stroke();

      // Main tapered stroke — emulate taper by drawing 2 strokes:
      // 1) wider gradient body, 2) thinner bright core
      const grad = ctx.createLinearGradient(s.x0, s.y0, s.x1, s.y1);
      grad.addColorStop(0, startCol);
      grad.addColorStop(1, endCol);
      ctx.strokeStyle = grad;
      ctx.lineWidth = (s.r0 + s.r1) * 0.5 + 0.4;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1);
      ctx.stroke();

      // Bright core highlight
      ctx.strokeStyle = `rgba(235, 220, 255, ${0.45 * alphaMul})`;
      ctx.lineWidth = Math.max(0.3, (s.r0 + s.r1) * 0.18);
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1);
      ctx.stroke();
    }

    // ─── Draw soma (organic blob with internal structures) ───────
    function drawSoma(state: BuiltState) {
      const { soma, somaCx, somaCy, somaR } = state;

      // Outer bloom halo
      const haloGrad = ctx.createRadialGradient(
        somaCx,
        somaCy,
        somaR * 0.5,
        somaCx,
        somaCy,
        somaR * 3.6
      );
      haloGrad.addColorStop(0, "rgba(157, 122, 255, 0.28)");
      haloGrad.addColorStop(0.4, "rgba(125, 95, 220, 0.10)");
      haloGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(somaCx, somaCy, somaR * 3.6, 0, Math.PI * 2);
      ctx.fill();

      // Membrane fill — radial gradient violet → deep navy
      const membraneGrad = ctx.createRadialGradient(
        somaCx - somaR * 0.25,
        somaCy - somaR * 0.3,
        somaR * 0.1,
        somaCx,
        somaCy,
        somaR * 1.15
      );
      membraneGrad.addColorStop(0, "#e8d4ff");
      membraneGrad.addColorStop(0.18, "#b794ff");
      membraneGrad.addColorStop(0.45, "#7c5ccc");
      membraneGrad.addColorStop(0.75, "#3a2570");
      membraneGrad.addColorStop(1, "#0d0820");

      ctx.beginPath();
      // Smooth catmull-rom-ish path through soma points
      const n = soma.length;
      const first = soma[0];
      if (!first) return;
      ctx.moveTo(
        (first.x + (soma[n - 1]?.x ?? first.x)) / 2,
        (first.y + (soma[n - 1]?.y ?? first.y)) / 2
      );
      for (let i = 0; i < n; i++) {
        const p = soma[i];
        const next = soma[(i + 1) % n];
        if (!p || !next) continue;
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        ctx.quadraticCurveTo(p.x, p.y, mx, my);
      }
      ctx.closePath();
      ctx.fillStyle = membraneGrad;
      ctx.fill();

      // Membrane rim — subtle bright outline
      ctx.strokeStyle = "rgba(220, 195, 255, 0.35)";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Cytoplasmic granules — scattered semi-transparent dots inside soma
      const granRand = rng(31337);
      const GRANS = 38;
      for (let i = 0; i < GRANS; i++) {
        const a = granRand() * Math.PI * 2;
        const r = granRand() * somaR * 0.78;
        const gx = somaCx + Math.cos(a) * r;
        const gy = somaCy + Math.sin(a) * r;
        const gr = 0.6 + granRand() * 1.4;
        ctx.fillStyle = `rgba(${200 + Math.floor(granRand() * 55)}, ${
          170 + Math.floor(granRand() * 55)
        }, 255, ${0.18 + granRand() * 0.25})`;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nucleus — slightly off-centre dark blob with bright nucleolus
      const nx = somaCx + somaR * 0.05;
      const ny = somaCy + somaR * 0.08;
      const nr = somaR * 0.45;
      const nucGrad = ctx.createRadialGradient(
        nx - nr * 0.3,
        ny - nr * 0.3,
        nr * 0.15,
        nx,
        ny,
        nr
      );
      nucGrad.addColorStop(0, "rgba(60, 30, 120, 0.85)");
      nucGrad.addColorStop(0.7, "rgba(25, 12, 55, 0.95)");
      nucGrad.addColorStop(1, "rgba(8, 4, 22, 1)");
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fillStyle = nucGrad;
      ctx.fill();

      // Nucleolus — tiny bright dot
      const nlx = nx - nr * 0.18;
      const nly = ny - nr * 0.1;
      const nlGrad = ctx.createRadialGradient(nlx, nly, 0, nlx, nly, nr * 0.18);
      nlGrad.addColorStop(0, "rgba(255, 220, 255, 0.95)");
      nlGrad.addColorStop(1, "rgba(180, 140, 255, 0)");
      ctx.beginPath();
      ctx.arc(nlx, nly, nr * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = nlGrad;
      ctx.fill();

      // Surface highlight — top-left specular
      const hlGrad = ctx.createRadialGradient(
        somaCx - somaR * 0.4,
        somaCy - somaR * 0.45,
        0,
        somaCx - somaR * 0.4,
        somaCy - somaR * 0.45,
        somaR * 0.55
      );
      hlGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      hlGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = hlGrad;
      ctx.beginPath();
      ctx.arc(somaCx - somaR * 0.4, somaCy - somaR * 0.45, somaR * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── Draw a bouton (synaptic terminal) ───────────────────────
    function drawBouton(b: Bouton, glow: number) {
      // outer halo
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 4.5);
      grad.addColorStop(0, `rgba(180, 230, 255, ${0.7 * b.brightness * glow})`);
      grad.addColorStop(0.4, `rgba(120, 180, 255, ${0.25 * b.brightness * glow})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // bright core
      ctx.fillStyle = `rgba(240, 250, 255, ${0.9 * b.brightness})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── Frame loop ──────────────────────────────────────────────
    let tick = 0;

    function draw() {
      const state = stateRef.current;
      if (!state) return;
      const { w, h, segments, boutons, pulses, paths } = state;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Background ambient — very soft purple wash so it sits in deep space
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "rgba(20, 10, 45, 0.35)");
      bg.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Use additive blending for that fluorescence-microscopy bloom
      ctx.globalCompositeOperation = "lighter";

      // 1) Far halo around all dendrites — draw two passes for depth
      for (const s of segments) {
        drawSegment(s, 1);
      }

      // 2) Boutons (synaptic terminals) with subtle pulsing brightness
      const flicker = 0.85 + Math.sin(tick * 0.04) * 0.15;
      for (const b of boutons) {
        // independent flicker per bouton based on position
        const f =
          flicker *
          (0.85 + Math.sin(tick * 0.05 + b.x * 0.02 + b.y * 0.013) * 0.15);
        drawBouton(b, f);
      }

      // 3) Action potential pulses — bright bead travelling along path
      for (const p of pulses) {
        const path = paths[p.pathIdx];
        if (!path) continue;
        const pos = samplePath(path, p.t, segments);
        if (pos) {
          const pulseR = 4 + Math.sin(tick * 0.1 + p.pathIdx) * 1.5;
          const grad = ctx.createRadialGradient(
            pos.x,
            pos.y,
            0,
            pos.x,
            pos.y,
            pulseR * 6
          );
          grad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * p.intensity})`);
          grad.addColorStop(0.25, `rgba(180, 230, 255, ${0.6 * p.intensity})`);
          grad.addColorStop(0.55, `rgba(100, 170, 255, ${0.25 * p.intensity})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseR * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        if (!reduceMotion) {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            // re-pick a path so the activity feels random
            p.pathIdx = Math.floor((Math.random() * paths.length) | 0);
            p.speed = 0.0015 + Math.random() * 0.0025;
          }
        }
      }

      // Restore normal blending for the soma so it can have dark internals
      ctx.globalCompositeOperation = "source-over";

      // 4) Soma — drawn last so it sits on top of dendrite bases
      drawSoma(state);

      // 5) Axon hillock highlight — subtle bright rim where axon leaves soma
      if (state.axonPath.length > 0) {
        const firstAxIdx = state.axonPath[0];
        if (firstAxIdx !== undefined) {
          const firstAx = segments[firstAxIdx];
          if (firstAx) {
            const grad = ctx.createRadialGradient(
              firstAx.x0,
              firstAx.y0,
              0,
              firstAx.x0,
              firstAx.y0,
              18
            );
            grad.addColorStop(0, "rgba(220, 200, 255, 0.6)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(firstAx.x0, firstAx.y0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          }
        }
      }

      tick++;
      if (!reduceMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    // ─── Wire up ────────────────────────────────────────────────
    resize();
    if (reduceMotion) {
      draw(); // single static frame
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      resize();
      if (reduceMotion) {
        draw();
      } else {
        rafRef.current = requestAnimationFrame(draw);
      }
    });
    ro.observe(wrap);

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else if (!reduceMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative w-full h-full ${className ?? ""}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
