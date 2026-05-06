"use client";

import { useEffect, useRef } from "react";

const NODES = [
  { id: "prompt",    x: 70,  y: 150, label: "Prompt",    color: "#00e5ff" },
  { id: "tokens",    x: 180, y: 80,  label: "Tokens",    color: "#9d7aff" },
  { id: "intent",    x: 300, y: 52,  label: "Intent",    color: "#9d7aff" },
  { id: "retrieval", x: 420, y: 85,  label: "Retrieval", color: "#00e5ff" },
  { id: "context",   x: 520, y: 160, label: "Context",   color: "#9d7aff" },
  { id: "model",     x: 460, y: 250, label: "Model",     color: "#9d7aff", large: true },
  { id: "stream",    x: 310, y: 290, label: "Stream",    color: "#00e5a0" },
  { id: "answer",    x: 155, y: 265, label: "Answer",    color: "#00e5a0", large: true },
];

const EDGES = [
  ["prompt", "tokens"],
  ["tokens", "intent"],
  ["intent", "retrieval"],
  ["retrieval", "context"],
  ["context", "model"],
  ["model", "stream"],
  ["stream", "answer"],
  ["prompt", "answer"],
  ["tokens", "model"],
  ["retrieval", "model"],
];

export function HeroNetworkVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / 600;
    const scaleY = H / 340;

    const scaledNodes = NODES.map((n) => ({
      ...n,
      sx: n.x * scaleX,
      sy: n.y * scaleY,
      r: (n.large ? 20 : 14) * Math.min(scaleX, scaleY),
    }));
    const nodeMap = new Map(scaledNodes.map((n) => [n.id, n]));

    // Pre-compute per-edge offsets for particle stagger
    const edgeOffsets = EDGES.map((_, i) => i / EDGES.length);

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H);

      // ── Draw edges ──
      for (let i = 0; i < EDGES.length; i++) {
        const [fromId, toId] = EDGES[i];
        const a = nodeMap.get(fromId)!;
        const b = nodeMap.get(toId)!;

        const dx = b.sx - a.sx;
        const dy = b.sy - a.sy;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Control point for slight curve (organic look)
        const cpx = (a.sx + b.sx) / 2 + (dy * 0.15);
        const cpy = (a.sy + b.sy) / 2 - (dx * 0.15);

        // Base edge — dim
        ctx!.beginPath();
        ctx!.moveTo(a.sx, a.sy);
        ctx!.quadraticCurveTo(cpx, cpy, b.sx, b.sy);
        ctx!.strokeStyle = "rgba(22,33,58,0.9)";
        ctx!.lineWidth = 1.2;
        ctx!.stroke();

        // Animated signal particle along the curve
        const speed = 0.00045;
        const progress = ((t * speed + edgeOffsets[i]) % 1 + 1) % 1;
        const t2 = progress;
        const px = (1-t2)*(1-t2)*a.sx + 2*(1-t2)*t2*cpx + t2*t2*b.sx;
        const py = (1-t2)*(1-t2)*a.sy + 2*(1-t2)*t2*cpy + t2*t2*b.sy;

        // Particle glow
        const gradient = ctx!.createRadialGradient(px, py, 0, px, py, 6);
        gradient.addColorStop(0, a.color + "cc");
        gradient.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(px, py, 6, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();

        // Particle core
        ctx!.beginPath();
        ctx!.arc(px, py, 2, 0, Math.PI * 2);
        ctx!.fillStyle = a.color;
        ctx!.globalAlpha = 0.9;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      // ── Draw nodes ──
      for (const n of scaledNodes) {
        const pulse = 0.82 + 0.18 * Math.sin(t * 0.0018 + n.sx * 0.01);

        // Outer atmospheric glow
        const atmRad = n.r * 3.2 * pulse;
        const atm = ctx!.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, atmRad);
        atm.addColorStop(0, n.color + "20");
        atm.addColorStop(0.5, n.color + "08");
        atm.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, atmRad, 0, Math.PI * 2);
        ctx!.fillStyle = atm;
        ctx!.fill();

        // Outer ring (subtle)
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, n.r + 5, 0, Math.PI * 2);
        ctx!.strokeStyle = n.color + "18";
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Node body
        const bodyGrad = ctx!.createRadialGradient(n.sx - n.r * 0.3, n.sy - n.r * 0.3, 0, n.sx, n.sy, n.r);
        bodyGrad.addColorStop(0, "#111d2e");
        bodyGrad.addColorStop(1, "#080d16");
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = bodyGrad;
        ctx!.fill();
        ctx!.strokeStyle = n.color + "55";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Inner glowing core
        const coreRad = n.r * 0.38 * pulse;
        const coreGrad = ctx!.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, coreRad);
        coreGrad.addColorStop(0, n.color + "ff");
        coreGrad.addColorStop(0.5, n.color + "88");
        coreGrad.addColorStop(1, n.color + "00");
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, coreRad, 0, Math.PI * 2);
        ctx!.fillStyle = coreGrad;
        ctx!.fill();

        // Label
        const fontSize = Math.max(9, 9.5 * Math.min(scaleX, scaleY));
        ctx!.font = `500 ${fontSize}px var(--font-inter, system-ui)`;
        ctx!.fillStyle = "#8ea4bc";
        ctx!.textAlign = "center";
        ctx!.fillText(n.label, n.sx, n.sy + n.r + 13);
      }
    }

    function loop(ts: number) {
      draw(ts);
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={340}
      className="w-full h-full"
      aria-hidden
    />
  );
}

