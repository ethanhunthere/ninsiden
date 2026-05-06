"use client";

import { useEffect, useRef } from "react";

/**
 * HeroNeuronCell — ultra-realistic biological pyramidal neuron.
 *
 * Built to look like a real fluorescence-microscopy image of a single
 * cortical pyramidal cell. Every detail mirrors actual neuroanatomy:
 *
 *   • Triangular pyramidal soma (perturbed polygon), nucleus & nucleolus,
 *     mitochondrial granules, top-left specular highlight, membrane rim.
 *   • One large apical dendrite emerging from the apex, recursively
 *     branching 6-7 levels deep.
 *   • 5 basal dendrites radiating from the cell body.
 *   • Polyline dendrites with per-vertex jitter (real dendrites are
 *     not smooth bezier curves — they have visible bends and wobbles).
 *   • DENDRITIC SPINES — the tiny perpendicular thorns covering every
 *     branch from level 2 onward (the single most recognisable feature
 *     of real pyramidal dendrites under fluorescent imaging).
 *   • A long thin axon with axon hillock and terminal arborisation.
 *   • Synaptic boutons (terminal blebs) at every twig tip with bright halos.
 *   • Atmospheric depth — finer/distal branches fade slightly.
 *   • Travelling action-potential pulses along random root-to-tip paths.
 *   • Fluorescence bloom via additive compositing.
 */

// ─── Types ─────────────────────────────────────────────────────────
interface PolyPoint {
  x: number;
  y: number;
  r: number; // radius at this vertex (for tapering)
}

interface Spine {
  x: number;
  y: number;
  ex: number;
  ey: number;
  headR: number;
}

interface Branch {
  pts: PolyPoint[];      // polyline (>=2 points)
  spines: Spine[];       // dendritic spines along this branch
  depth: number;         // 0 = trunk
  childIdxs: number[];   // children in the global branches array
}

interface Bouton {
  x: number;
  y: number;
  r: number;
  brightness: number;
}

interface Pulse {
  pathIdx: number;       // index into rootPaths[]
  t: number;             // 0..1 along the path
  speed: number;
}

interface SomaPoint {
  x: number;
  y: number;
}

interface BuiltState {
  branches: Branch[];
  boutons: Bouton[];
  rootPaths: number[][]; // each = ordered list of branch indices from a root to a terminal
  pulses: Pulse[];
  soma: SomaPoint[];
  somaCx: number;
  somaCy: number;
  somaR: number;
  axonBranches: number[]; // indices into branches[] forming the axon trunk
  w: number;
  h: number;
}

// ─── Deterministic RNG ────────────────────────────────────────────
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Component ────────────────────────────────────────────────────
export function HeroNeuronCell({ className }: { className?: string }) {
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

    // ─── Build geometry ────────────────────────────────────────
    function build(w: number, h: number) {
      const cx = w * 0.5;
      const cy = h * 0.58;
      const scale = Math.min(w, h) / 640;
      const somaR = Math.max(28, 48 * scale);
      const rand = rng(2026);

      // Pyramidal soma — triangular-ish blob with rounded apex pointing up.
      // Built as a perturbed parametric outline.
      const SOMA_POINTS = 56;
      const soma: SomaPoint[] = [];
      for (let i = 0; i < SOMA_POINTS; i++) {
        const t = i / SOMA_POINTS;
        const a = t * Math.PI * 2 - Math.PI / 2; // start at apex (top)
        // Triangle-ish shape: longer at -90 (apex), wider at the base
        const triShape =
          1 +
          Math.cos(a + Math.PI / 2) * 0.18 + // pull apex up
          Math.abs(Math.sin(a)) * 0.05;       // slight squeeze at sides
        const noise =
          Math.sin(a * 3 + 0.7) * 0.05 +
          Math.sin(a * 6 + 1.4) * 0.035 +
          Math.sin(a * 13 + 2.3) * 0.02 +
          (rand() - 0.5) * 0.02;
        const r = somaR * triShape * (1 + noise);
        soma.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }

      const branches: Branch[] = [];
      const boutons: Bouton[] = [];
      const rootPaths: number[][] = [];

      /** Build a polyline from start to end with jitter. */
      function buildPolyline(
        sx: number,
        sy: number,
        angle: number,
        length: number,
        r0: number,
        r1: number,
        rnd: () => number,
        segCount: number
      ): PolyPoint[] {
        const pts: PolyPoint[] = [];
        // perpendicular axis for jitter
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        // Smooth low-frequency curve component (random sinusoidal bend)
        const bendAmp = (rnd() - 0.5) * length * 0.18;
        const bendPhase = rnd() * Math.PI * 2;

        for (let i = 0; i <= segCount; i++) {
          const t = i / segCount;
          // along-axis position
          const ax = sx + Math.cos(angle) * length * t;
          const ay = sy + Math.sin(angle) * length * t;
          // smooth bend
          const bend = Math.sin(t * Math.PI + bendPhase) * bendAmp;
          // small per-vertex jitter (the "wobble" real dendrites have)
          const jitter = (rnd() - 0.5) * Math.max(0.6, r0 * 0.7);
          const off = bend + jitter;
          const x = ax + nx * off;
          const y = ay + ny * off;
          // radius interpolated with slight noise
          const rT = r0 + (r1 - r0) * t;
          const rNoise = rT * (0.92 + rnd() * 0.16);
          pts.push({ x, y, r: rNoise });
        }
        return pts;
      }

      /** Generate spines along a polyline (skip first/last few %). */
      function buildSpines(
        pts: PolyPoint[],
        depth: number,
        rnd: () => number
      ): Spine[] {
        if (depth < 2) return []; // trunk has no visible spines
        const spines: Spine[] = [];
        for (let i = 1; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          if (!a || !b) continue;
          // Spine density falls off near terminal tips
          const density = depth >= 5 ? 0.4 : 0.7;
          if (rnd() > density) continue;
          // Number of spines per inter-vertex segment
          const count = 1 + Math.floor(rnd() * 2);
          for (let k = 0; k < count; k++) {
            const t = rnd();
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            // perpendicular to local segment
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const seglen = Math.hypot(dx, dy) || 1;
            const nx = -dy / seglen;
            const ny = dx / seglen;
            const side = rnd() > 0.5 ? 1 : -1;
            const spineLen = 1.8 + rnd() * 3.2;
            const ex = sx + nx * side * spineLen;
            const ey = sy + ny * side * spineLen;
            spines.push({
              x: sx,
              y: sy,
              ex,
              ey,
              headR: 0.6 + rnd() * 0.9,
            });
          }
        }
        return spines;
      }

      /**
       * Recursively grow a dendritic tree from (sx, sy) at `angle`.
       * Returns the index of the branch that was just created.
       */
      function grow(
        sx: number,
        sy: number,
        angle: number,
        length: number,
        thickness: number,
        depth: number,
        maxDepth: number,
        path: number[],
        rnd: () => number,
        spineEnabled = true
      ): number {
        const r0 = thickness;
        const r1 = Math.max(0.25, thickness * 0.66);
        // More polyline subdivisions on long trunk segments
        const segCount = Math.max(6, Math.floor(length / 9));
        const pts = buildPolyline(sx, sy, angle, length, r0, r1, rnd, segCount);
        const spines = spineEnabled ? buildSpines(pts, depth, rnd) : [];

        const branch: Branch = { pts, spines, depth, childIdxs: [] };
        const idx = branches.length;
        branches.push(branch);
        path.push(idx);

        const lastPt = pts[pts.length - 1];
        if (!lastPt) {
          path.pop();
          return idx;
        }

        // Terminate?
        const terminate =
          depth >= maxDepth || length < 7 || (depth >= 3 && rnd() < 0.12);
        if (terminate) {
          boutons.push({
            x: lastPt.x,
            y: lastPt.y,
            r: Math.max(1.4, r1 * 1.6 + rnd() * 1.2),
            brightness: 0.6 + rnd() * 0.4,
          });
          rootPaths.push([...path]);
          path.pop();
          return idx;
        }

        // Children (real dendrites mostly bifurcate — 2 children typical,
        // sometimes 1 (continuation), rarely 3)
        const roll = rnd();
        const childCount = roll < 0.08 ? 3 : roll < 0.18 ? 1 : 2;
        const spread = 0.45 + rnd() * 0.45;
        const lengthFactor = 0.6 + rnd() * 0.18;

        // Continuation angle = direction of last polyline segment
        const prev = pts[pts.length - 2] ?? { x: sx, y: sy };
        const contAngle = Math.atan2(lastPt.y - prev.y, lastPt.x - prev.x);

        for (let i = 0; i < childCount; i++) {
          const tDist = childCount === 1 ? 0 : (i / (childCount - 1)) * 2 - 1;
          const childAngle =
            contAngle + tDist * spread + (rnd() - 0.5) * 0.3;
          const childLength = length * lengthFactor * (0.85 + rnd() * 0.3);
          const childThick = r1 * (0.78 + rnd() * 0.16);
          const childIdx = grow(
            lastPt.x,
            lastPt.y,
            childAngle,
            childLength,
            childThick,
            depth + 1,
            maxDepth,
            path,
            rnd,
            spineEnabled
          );
          branch.childIdxs.push(childIdx);
        }

        path.pop();
        return idx;
      }

      // ─── Apical dendrite (single dominant trunk going up) ────
      // Emerges from soma apex
      const apexY = cy - somaR * 1.0;
      grow(
        cx,
        apexY,
        -Math.PI / 2 + (rand() - 0.5) * 0.12,
        140 * scale,
        Math.max(2.6, 4.6 * scale),
        0,
        6,
        [],
        rng(11),
        true
      );

      // ─── Basal dendrites (5 around the lower half of the soma) ─
      const BASAL_COUNT = 5;
      for (let i = 0; i < BASAL_COUNT; i++) {
        const baseAngle =
          Math.PI * 0.18 +
          (i / (BASAL_COUNT - 1)) * Math.PI * 0.65 +
          (rand() - 0.5) * 0.18;
        const sx = cx + Math.cos(baseAngle) * somaR * 0.92;
        const sy = cy + Math.sin(baseAngle) * somaR * 0.92;
        const len = (75 + rand() * 50) * scale;
        const thick = Math.max(1.7, (3.0 + rand() * 0.5) * scale);
        grow(sx, sy, baseAngle, len, thick, 0, 5, [], rng(2000 + i * 41), true);
      }

      // ─── Lateral oblique dendrites (2-3 short ones from sides) ─
      for (let i = 0; i < 3; i++) {
        const baseAngle =
          (i % 2 === 0 ? -1 : 1) * (Math.PI * 0.45 + rand() * 0.2) +
          (rand() - 0.5) * 0.1;
        const sx = cx + Math.cos(baseAngle) * somaR * 0.9;
        const sy = cy + Math.sin(baseAngle) * somaR * 0.9;
        const len = (55 + rand() * 35) * scale;
        const thick = Math.max(1.4, (2.4 + rand() * 0.4) * scale);
        grow(sx, sy, baseAngle, len, thick, 0, 4, [], rng(3000 + i * 17), true);
      }

      // ─── Axon (single long thin process going down-left) ─────
      const axonBranches: number[] = [];
      const axonAngle = Math.PI * 0.62 + (rand() - 0.5) * 0.12;
      let ax = cx + Math.cos(axonAngle) * somaR * 1.0;
      let ay = cy + Math.sin(axonAngle) * somaR * 1.0;
      let aAngle = axonAngle;
      let aThick = Math.max(1.4, 2.2 * scale);
      const axRand = rng(7777);
      for (let i = 0; i < 7; i++) {
        const len = (50 + axRand() * 35) * scale;
        const segCount = Math.max(5, Math.floor(len / 10));
        const pts = buildPolyline(
          ax,
          ay,
          aAngle,
          len,
          aThick,
          aThick * 0.96,
          axRand,
          segCount
        );
        const idx = branches.length;
        branches.push({ pts, spines: [], depth: 0, childIdxs: [] });
        axonBranches.push(idx);
        const last = pts[pts.length - 1];
        if (!last) break;
        ax = last.x;
        ay = last.y;
        aAngle += (axRand() - 0.5) * 0.4;
        aThick = Math.max(0.7, aThick * 0.94);
      }
      // Axon terminal arborisation — small spray with boutons
      for (let i = 0; i < 6; i++) {
        const tAngle = aAngle + (i / 5 - 0.5) * 1.0;
        const tLen = (28 + axRand() * 22) * scale;
        const pts = buildPolyline(
          ax,
          ay,
          tAngle,
          tLen,
          aThick,
          Math.max(0.4, aThick * 0.7),
          axRand,
          5
        );
        const idx = branches.length;
        branches.push({ pts, spines: [], depth: 0, childIdxs: [] });
        axonBranches.push(idx);
        const last = pts[pts.length - 1];
        if (last) {
          boutons.push({
            x: last.x,
            y: last.y,
            r: 1.6 + axRand() * 1.2,
            brightness: 0.85,
          });
        }
      }

      // ─── Action-potential pulses ─────────────────────────────
      const pulses: Pulse[] = [];
      const pulseRand = rng(909);
      for (let i = 0; i < 7; i++) {
        pulses.push({
          pathIdx: Math.floor(pulseRand() * rootPaths.length),
          t: pulseRand(),
          speed: 0.0014 + pulseRand() * 0.002,
        });
      }

      stateRef.current = {
        branches,
        boutons,
        rootPaths,
        pulses,
        soma,
        somaCx: cx,
        somaCy: cy,
        somaR,
        axonBranches,
        w,
        h,
      };
    }

    // ─── Resize ────────────────────────────────────────────────
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

    // ─── Sample point along a sequence of branches (root → tip) ─
    function samplePath(path: number[], t: number, branches: Branch[]) {
      // Stitch all polyline points end-to-end and walk by arc length
      let total = 0;
      const cumLens: number[] = [0];
      const allPts: PolyPoint[] = [];
      for (const bi of path) {
        const b = branches[bi];
        if (!b) continue;
        for (let i = 0; i < b.pts.length; i++) {
          const p = b.pts[i];
          if (!p) continue;
          if (allPts.length > 0) {
            const prev = allPts[allPts.length - 1];
            if (prev) {
              total += Math.hypot(p.x - prev.x, p.y - prev.y);
              cumLens.push(total);
            }
          }
          allPts.push(p);
        }
      }
      if (allPts.length < 2) return null;
      const target = t * total;
      // binary search cumLens
      let lo = 0;
      let hi = cumLens.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        const mv = cumLens[mid];
        if (mv === undefined || mv < target) lo = mid + 1;
        else hi = mid;
      }
      const i = Math.max(1, lo);
      const a = allPts[i - 1];
      const b = allPts[i];
      const cl0 = cumLens[i - 1];
      const cl1 = cumLens[i];
      if (!a || !b || cl0 === undefined || cl1 === undefined) return null;
      const segLen = cl1 - cl0 || 1;
      const localT = (target - cl0) / segLen;
      return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT };
    }

    // ─── Draw a polyline branch (multi-pass: glow + body + core) ─
    function drawBranch(b: Branch) {
      const pts = b.pts;
      if (pts.length < 2) return;

      // Depth-based fade (atmospheric perspective on distal twigs)
      const depthFade = Math.max(0.45, 1 - b.depth * 0.07);

      // Build path once
      ctx.beginPath();
      const first = pts[0];
      if (!first) return;
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p) ctx.lineTo(p.x, p.y);
      }

      const avgR = ((pts[0]?.r ?? 1) + (pts[pts.length - 1]?.r ?? 1)) / 2;

      // 1) Outer fluorescence glow
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(157, 122, 255, ${0.16 * depthFade})`;
      ctx.lineWidth = avgR * 4 + 2;
      ctx.stroke();

      // 2) Mid stroke — colour body, gradient along start→end
      const last = pts[pts.length - 1];
      if (last) {
        const grad = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
        // Near-soma → magenta-violet, distal → cyan-white
        const tipness = Math.min(1, b.depth / 6);
        grad.addColorStop(
          0,
          `rgba(${200 - tipness * 60}, ${130 + tipness * 60}, 255, ${0.85 * depthFade})`
        );
        grad.addColorStop(
          1,
          `rgba(${150 + tipness * 70}, ${210 + tipness * 35}, 255, ${0.9 * depthFade})`
        );
        ctx.strokeStyle = grad;
        ctx.lineWidth = avgR * 1.3 + 0.5;
        ctx.stroke();
      }

      // 3) Bright core highlight
      ctx.strokeStyle = `rgba(245, 230, 255, ${0.55 * depthFade})`;
      ctx.lineWidth = Math.max(0.3, avgR * 0.4);
      ctx.stroke();

      // 4) Spines — tiny perpendicular thorns
      for (const sp of b.spines) {
        ctx.strokeStyle = `rgba(200, 170, 255, ${0.5 * depthFade})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.ex, sp.ey);
        ctx.stroke();
        // little spine head (bouton-like)
        ctx.fillStyle = `rgba(230, 210, 255, ${0.7 * depthFade})`;
        ctx.beginPath();
        ctx.arc(sp.ex, sp.ey, sp.headR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─── Draw soma ─────────────────────────────────────────────
    function drawSoma(state: BuiltState) {
      const { soma, somaCx, somaCy, somaR } = state;

      // Outer bloom halo
      const halo = ctx.createRadialGradient(
        somaCx,
        somaCy,
        somaR * 0.4,
        somaCx,
        somaCy,
        somaR * 4
      );
      halo.addColorStop(0, "rgba(157, 122, 255, 0.32)");
      halo.addColorStop(0.4, "rgba(125, 95, 220, 0.12)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(somaCx, somaCy, somaR * 4, 0, Math.PI * 2);
      ctx.fill();

      // Membrane fill
      const mem = ctx.createRadialGradient(
        somaCx - somaR * 0.25,
        somaCy - somaR * 0.3,
        somaR * 0.08,
        somaCx,
        somaCy,
        somaR * 1.2
      );
      mem.addColorStop(0, "#f0dcff");
      mem.addColorStop(0.16, "#c19cff");
      mem.addColorStop(0.42, "#8262d6");
      mem.addColorStop(0.72, "#3a2570");
      mem.addColorStop(1, "#0a0620");

      ctx.beginPath();
      const n = soma.length;
      const first = soma[0];
      const lastSoma = soma[n - 1];
      if (!first || !lastSoma) return;
      ctx.moveTo((first.x + lastSoma.x) / 2, (first.y + lastSoma.y) / 2);
      for (let i = 0; i < n; i++) {
        const p = soma[i];
        const next = soma[(i + 1) % n];
        if (!p || !next) continue;
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        ctx.quadraticCurveTo(p.x, p.y, mx, my);
      }
      ctx.closePath();
      ctx.fillStyle = mem;
      ctx.fill();

      // Membrane rim
      ctx.strokeStyle = "rgba(220, 195, 255, 0.42)";
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Cytoplasmic granules
      const granRand = rng(40404);
      for (let i = 0; i < 48; i++) {
        const a = granRand() * Math.PI * 2;
        const r = granRand() * somaR * 0.78;
        const gx = somaCx + Math.cos(a) * r;
        const gy = somaCy + Math.sin(a) * r;
        const gr = 0.5 + granRand() * 1.4;
        ctx.fillStyle = `rgba(${200 + Math.floor(granRand() * 55)}, ${
          170 + Math.floor(granRand() * 55)
        }, 255, ${0.18 + granRand() * 0.28})`;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nucleus
      const nx = somaCx + somaR * 0.04;
      const ny = somaCy + somaR * 0.1;
      const nr = somaR * 0.46;
      const nucGrad = ctx.createRadialGradient(
        nx - nr * 0.3,
        ny - nr * 0.3,
        nr * 0.12,
        nx,
        ny,
        nr
      );
      nucGrad.addColorStop(0, "rgba(70, 35, 130, 0.85)");
      nucGrad.addColorStop(0.7, "rgba(25, 12, 55, 0.95)");
      nucGrad.addColorStop(1, "rgba(8, 4, 22, 1)");
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fillStyle = nucGrad;
      ctx.fill();

      // Nucleolus
      const nlx = nx - nr * 0.18;
      const nly = ny - nr * 0.1;
      const nlGrad = ctx.createRadialGradient(nlx, nly, 0, nlx, nly, nr * 0.2);
      nlGrad.addColorStop(0, "rgba(255, 220, 255, 0.95)");
      nlGrad.addColorStop(1, "rgba(180, 140, 255, 0)");
      ctx.beginPath();
      ctx.arc(nlx, nly, nr * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = nlGrad;
      ctx.fill();

      // Specular highlight
      const hlGrad = ctx.createRadialGradient(
        somaCx - somaR * 0.4,
        somaCy - somaR * 0.5,
        0,
        somaCx - somaR * 0.4,
        somaCy - somaR * 0.5,
        somaR * 0.55
      );
      hlGrad.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      hlGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = hlGrad;
      ctx.beginPath();
      ctx.arc(somaCx - somaR * 0.4, somaCy - somaR * 0.5, somaR * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── Draw bouton ──────────────────────────────────────────
    function drawBouton(b: Bouton, glow: number) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 5);
      grad.addColorStop(0, `rgba(200, 240, 255, ${0.7 * b.brightness * glow})`);
      grad.addColorStop(0.4, `rgba(130, 190, 255, ${0.25 * b.brightness * glow})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(245, 250, 255, ${0.92 * b.brightness})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── Frame loop ───────────────────────────────────────────
    let tick = 0;

    function draw() {
      const state = stateRef.current;
      if (!state) return;
      const { w, h, branches, boutons, pulses, rootPaths } = state;

      ctx.clearRect(0, 0, w, h);

      // Background ambient wash
      const bg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.7
      );
      bg.addColorStop(0, "rgba(20, 10, 45, 0.35)");
      bg.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Additive bloom for dendrites
      ctx.globalCompositeOperation = "lighter";

      // Sort branches deepest-first so trunks sit on top
      // (depth 0 drawn last → most prominent)
      const order = branches
        .map((_, i) => i)
        .sort((a, b) => {
          const ba = branches[a];
          const bb = branches[b];
          return (bb?.depth ?? 0) - (ba?.depth ?? 0);
        });
      for (const i of order) {
        const b = branches[i];
        if (b) drawBranch(b);
      }

      // Boutons
      const flicker = 0.85 + Math.sin(tick * 0.04) * 0.15;
      for (const b of boutons) {
        const f =
          flicker *
          (0.85 + Math.sin(tick * 0.05 + b.x * 0.02 + b.y * 0.013) * 0.15);
        drawBouton(b, f);
      }

      // Action potentials
      for (const p of pulses) {
        const path = rootPaths[p.pathIdx];
        if (!path) continue;
        const pos = samplePath(path, p.t, branches);
        if (pos) {
          const pulseR = 4 + Math.sin(tick * 0.1 + p.pathIdx) * 1.5;
          const grad = ctx.createRadialGradient(
            pos.x,
            pos.y,
            0,
            pos.x,
            pos.y,
            pulseR * 7
          );
          grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          grad.addColorStop(0.2, "rgba(190, 240, 255, 0.6)");
          grad.addColorStop(0.55, "rgba(110, 180, 255, 0.22)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseR * 7, 0, Math.PI * 2);
          ctx.fill();
        }
        if (!reduceMotion) {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            p.pathIdx = Math.floor(Math.random() * rootPaths.length);
            p.speed = 0.0014 + Math.random() * 0.002;
          }
        }
      }

      // Soma on top
      ctx.globalCompositeOperation = "source-over";
      drawSoma(state);

      // Axon hillock highlight
      if (state.axonBranches.length > 0) {
        const firstAxIdx = state.axonBranches[0];
        if (firstAxIdx !== undefined) {
          const firstAx = branches[firstAxIdx];
          const start = firstAx?.pts[0];
          if (start) {
            const grad = ctx.createRadialGradient(start.x, start.y, 0, start.x, start.y, 22);
            grad.addColorStop(0, "rgba(220, 200, 255, 0.55)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(start.x, start.y, 22, 0, Math.PI * 2);
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

    // ─── Wire up ────────────────────────────────────────────
    resize();
    if (reduceMotion) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      resize();
      if (reduceMotion) draw();
      else rafRef.current = requestAnimationFrame(draw);
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
