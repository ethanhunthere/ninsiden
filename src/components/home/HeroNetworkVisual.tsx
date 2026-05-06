"use client";

import { useEffect, useRef } from "react";

const NODES = [
  { id: "prompt", x: 60, y: 140, label: "Prompt", color: "#00d4ff" },
  { id: "tokens", x: 180, y: 80, label: "Tokens", color: "#8b5cf6" },
  { id: "intent", x: 300, y: 50, label: "Intent", color: "#8b5cf6" },
  { id: "retrieval", x: 420, y: 90, label: "Retrieval", color: "#00d4ff" },
  { id: "context", x: 510, y: 160, label: "Context", color: "#8b5cf6" },
  { id: "model", x: 450, y: 240, label: "Model", color: "#8b5cf6", large: true },
  { id: "stream", x: 310, y: 280, label: "Stream", color: "#10b981" },
  { id: "answer", x: 160, y: 260, label: "Answer", color: "#10b981", large: true },
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
];

export function HeroNetworkVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Scale nodes to canvas size
    const scaleX = W / 600;
    const scaleY = H / 340;

    const scaledNodes = NODES.map((n) => ({
      ...n,
      sx: n.x * scaleX,
      sy: n.y * scaleY,
      r: (n.large ? 22 : 16) * Math.min(scaleX, scaleY),
    }));

    const nodeMap = new Map(scaledNodes.map((n) => [n.id, n]));

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H);

      // Draw edges
      for (const [from, to] of EDGES) {
        const a = nodeMap.get(from)!;
        const b = nodeMap.get(to)!;
        const progress = ((t * 0.0008 + (a.sx + b.sx) / W) % 1 + 1) % 1;

        ctx!.beginPath();
        ctx!.moveTo(a.sx, a.sy);
        ctx!.lineTo(b.sx, b.sy);
        ctx!.strokeStyle = "rgba(30,34,60,0.8)";
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Animated particle
        const px = a.sx + (b.sx - a.sx) * progress;
        const py = a.sy + (b.sy - a.sy) * progress;
        ctx!.beginPath();
        ctx!.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = a.color;
        ctx!.globalAlpha = 0.7;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      // Draw nodes
      for (const n of scaledNodes) {
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.002 + n.sx);

        // Outer glow
        const grad = ctx!.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, n.r * 2.5);
        grad.addColorStop(0, n.color + "30");
        grad.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, n.r * 2.5 * pulse, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Node circle
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = "#0d1117";
        ctx!.fill();
        ctx!.strokeStyle = n.color + "80";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Inner dot
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, n.r * 0.35, 0, Math.PI * 2);
        ctx!.fillStyle = n.color;
        ctx!.globalAlpha = pulse;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        // Label
        ctx!.font = `${Math.max(9, 10 * Math.min(scaleX, scaleY))}px var(--font-inter, system-ui)`;
        ctx!.fillStyle = "#94a3b8";
        ctx!.textAlign = "center";
        ctx!.fillText(n.label, n.sx, n.sy + n.r + 14);
      }
    }

    function loop(ts: number) {
      timeRef.current = ts;
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
      className="w-full h-full opacity-90"
      aria-hidden
    />
  );
}
