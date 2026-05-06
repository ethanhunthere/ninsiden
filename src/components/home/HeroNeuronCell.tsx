"use client";

import { useEffect, useRef } from "react";

/**
 * HeroNeuronCell — large cinematic biological neuron.
 *
 * Renders a single dominant neuron (soma + organic curved dendrites +
 * synaptic terminal points) with travelling action-potential pulses.
 * Designed to fill the left or background area of the homepage hero,
 * matching the look of a real-neuron photograph but rendered live.
 *
 * Single canvas, single rAF loop, DPR-aware, ResizeObserver-driven.
 */

interface Branch {
  /** end-point relative to parent end */
  ax: number;
  ay: number;
  /** control point relative to parent end */
  cx: number;
  cy: number;
  /** sub-branches (recursive but capped at depth 2) */
  subs: SubBranch[];
  /** pulse 0..1 along this branch */
  pulse: number;
  pulseSpeed: number;
  /** offset so pulses don't all start at 0 */
  pulseOffset: number;
}

interface SubBranch {
  ax: number;
  ay: number;
  cx: number;
  cy: number;
  /** terminal node radius */
  tipR: number;
  /** terminal glow brightness */
  tipBrightness: number;
}

const COLOR_CYAN = "#00e5ff";
const COLOR_VIOLET = "#9d7aff";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function HeroNeuronCell() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const stateRef = useRef<{
    branches: Branch[];
    cx: number;
    cy: number;
    somaR: number;
    w: number;
    h: number;
  }>({ branches: [], cx: 0, cy: 0, somaR: 0, w: 0, h: 0 });

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

    function build(w: number, h: number) {
      const cx = w * 0.5;
      const cy = h * 0.55;
      const scale = Math.min(w, h) / 600;
      const somaR = Math.max(28, 46 * scale);
      const rand = rng(42);

      const BRANCH_COUNT = 7;
      const branches: Branch[] = [];
      for (let i = 0; i < BRANCH_COUNT; i++) {
        const angle = (i / BRANCH_COUNT) * Math.PI * 2 + rand() * 0.4;
        const length = (180 + rand() * 160) * scale;
        const ax = Math.cos(angle) * length;
        const ay = Math.sin(angle) * length;

        // Curve normal
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        const curveAmount = (rand() - 0.5) * length * 0.6;
        const halfX = ax * 0.5 + nx * curveAmount;
        const halfY = ay * 0.5 + ny * curveAmount;

        const subCount = 2 + Math.floor(rand() * 3);
        const subs: SubBranch[] = [];
        for (let k = 0; k < subCount; k++) {
          const sa = angle + (rand() - 0.5) * 1.4;
          const sl = length * (0.35 + rand() * 0.55);
          const sax = ax + Math.cos(sa) * sl;
          const say = ay + Math.sin(sa) * sl;
          const snx = -Math.sin(sa);
          const sny = Math.cos(sa);
          const sCurve = (rand() - 0.5) * sl * 0.45;
          subs.push({
            ax: sax,
            ay: say,
            cx: ax + Math.cos(sa) * sl * 0.5 + snx * sCurve,
            cy: ay + Math.sin(sa) * sl * 0.5 + sny * sCurve,
            tipR: 2.5 + rand() * 3 * scale,
            tipBrightness: 0.7 + rand() * 0.3,
          });
        }

        branches.push({
          ax,
          ay,
          cx: halfX,
          cy: halfY,
          subs,
          pulse: rand(),
          pulseSpeed: 0.0028 + rand() * 0.0035,
          pulseOffset: rand(),
        });
      }
      stateRef.current = { branches, cx, cy, somaR, w, h };
    }

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

    let tick = 0;

    function quad(t: number, p0: number, p1: number, p2: number) {
      const u = 1 - t;
      return u * u * p0 + 2 * u * t * p1 + t * t * p2;
    }

    function drawBranch(b: Branch, originX: number, originY: number) {
      const ex = originX + b.ax;
      const ey = originY + b.ay;
      const cx = originX + b.cx;
      const cy = originY + b.cy;

      // Main dendrite — cyan-violet gradient stroke
      const grad = ctx.createLinearGradient(originX, originY, ex, ey);
      grad.addColorStop(0, COLOR_CYAN + "55");
      grad.addColorStop(0.6, COLOR_VIOLET + "40");
      grad.addColorStop(1, COLOR_VIOLET + "18");
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Soft outer glow on dendrite
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.strokeStyle = COLOR_VIOLET + "0c";
      ctx.lineWidth = 5;
      ctx.stroke();

      // Sub-branches
      for (const s of b.subs) {
        const sex = originX + s.ax;
        const sey = originY + s.ay;
        const scx = originX + s.cx;
        const scy = originY + s.cy;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.quadraticCurveTo(scx, scy, sex, sey);
        ctx.strokeStyle = COLOR_CYAN + "30";
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Synaptic terminal — bright glowing dot
        const tipPulse =
          0.85 + 0.15 * Math.sin(tick * 0.04 + s.tipR * 1.7);
        const tipR = s.tipR * tipPulse;
        const tipGrd = ctx.createRadialGradient(
          sex,
          sey,
          0,
          sex,
          sey,
          tipR * 4
        );
        tipGrd.addColorStop(0, COLOR_CYAN + "ff");
        tipGrd.addColorStop(0.3, COLOR_CYAN + "70");
        tipGrd.addColorStop(1, "rgba(0,229,255,0)");
        ctx.beginPath();
        ctx.arc(sex, sey, tipR * 4, 0, Math.PI * 2);
        ctx.fillStyle = tipGrd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sex, sey, tipR, 0, Math.PI * 2);
        ctx.fillStyle = "#dffaff";
        ctx.fill();
      }

      // Travelling action-potential pulse along main dendrite
      const t = (b.pulse + b.pulseOffset) % 1;
      const px = quad(t, originX, cx, ex);
      const py = quad(t, originY, cy, ey);
      const pulseR = 3.5;
      const pulseGrd = ctx.createRadialGradient(px, py, 0, px, py, pulseR * 4);
      pulseGrd.addColorStop(0, "#ffffffee");
      pulseGrd.addColorStop(0.3, COLOR_CYAN + "cc");
      pulseGrd.addColorStop(1, "rgba(0,229,255,0)");
      ctx.beginPath();
      ctx.arc(px, py, pulseR * 4, 0, Math.PI * 2);
      ctx.fillStyle = pulseGrd;
      ctx.fill();
    }

    function drawSoma(x: number, y: number, r: number) {
      // Outer atmospheric glow
      const outer = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      outer.addColorStop(0, "rgba(157,122,255,0.45)");
      outer.addColorStop(0.4, "rgba(0,229,255,0.18)");
      outer.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(x, y, r * 5, 0, Math.PI * 2);
      ctx.fillStyle = outer;
      ctx.fill();

      // Cell body — purple core to dark edge
      const body = ctx.createRadialGradient(
        x - r * 0.25,
        y - r * 0.25,
        0,
        x,
        y,
        r
      );
      body.addColorStop(0, "#cdb4ff");
      body.addColorStop(0.4, "#7c5ccc");
      body.addColorStop(0.85, "#3a2570");
      body.addColorStop(1, "#0a0716");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      // Core highlight (nucleus-like)
      ctx.beginPath();
      ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fill();

      // Edge ring
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(157,122,255,0.7)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    function draw() {
      const { branches, cx, cy, somaR, w, h } = stateRef.current;
      ctx.clearRect(0, 0, w, h);

      // Atmospheric background blur (subtle)
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
      bg.addColorStop(0, "rgba(157,122,255,0.06)");
      bg.addColorStop(0.5, "rgba(0,229,255,0.02)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Draw all branches under the soma so the cell sits on top
      for (const b of branches) {
        b.pulse += b.pulseSpeed;
        if (b.pulse > 1) b.pulse = 0;
        drawBranch(b, cx, cy);
      }

      drawSoma(cx, cy, somaR);
    }

    function loop() {
      tick++;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    if (reduceMotion) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
