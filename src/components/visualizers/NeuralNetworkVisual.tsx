"use client";

import { useEffect, useRef } from "react";

const LAYERS = [
  { count: 3, label: "Input" },
  { count: 4, label: "Hidden 1" },
  { count: 4, label: "Hidden 2" },
  { count: 1, label: "Output" },
];

export function NeuralNetworkVisual({
  width = 520,
  height = 280,
  highlightLayer,
  animating = true,
}: {
  width?: number;
  height?: number;
  highlightLayer?: number;
  animating?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padX = 70;
    const layerSpacingX = (width - padX * 2) / (LAYERS.length - 1);
    const maxNodes = Math.max(...LAYERS.map((l) => l.count));
    const nodeRadius = 14;
    const nodeSpacingY = Math.min(56, (height - 60) / maxNodes);

    // Precompute positions
    const layerPositions = LAYERS.map((layer, li) => {
      const x = padX + li * layerSpacingX;
      const totalH = (layer.count - 1) * nodeSpacingY;
      const startY = height / 2 - totalH / 2;
      return Array.from({ length: layer.count }, (_, ni) => ({
        x,
        y: startY + ni * nodeSpacingY,
        layer: li,
        node: ni,
      }));
    });

    let t = 0;

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Draw edges
      for (let li = 0; li < LAYERS.length - 1; li++) {
        for (const from of layerPositions[li]) {
          for (const to of layerPositions[li + 1]) {
            const progress = animating
              ? ((t * 0.5 + from.y + to.y) % 80) / 80
              : 0;

            const baseAlpha = highlightLayer === li ? 0.3 : 0.1;
            ctx!.beginPath();
            ctx!.moveTo(from.x, from.y);
            ctx!.lineTo(to.x, to.y);
            ctx!.strokeStyle = `rgba(30,34,60,${baseAlpha * 3})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();

            if (animating) {
              const px = from.x + (to.x - from.x) * progress;
              const py = from.y + (to.y - from.y) * progress;
              ctx!.beginPath();
              ctx!.arc(px, py, 2, 0, Math.PI * 2);
              ctx!.fillStyle = li < 2 ? "rgba(0,212,255,0.5)" : "rgba(16,185,129,0.6)";
              ctx!.fill();
            }
          }
        }
      }

      // Draw nodes
      for (let li = 0; li < LAYERS.length; li++) {
        const isHighlight = highlightLayer === li;
        const color =
          li === 0
            ? "#00e5ff"
            : li === LAYERS.length - 1
            ? "#00e5a0"
            : "#9d7aff";
        const pulse = animating ? 0.8 + 0.2 * Math.sin(t * 0.04 + li) : 1;

        for (const { x, y } of layerPositions[li]) {
          // Glow
          if (isHighlight || animating) {
            const grad = ctx!.createRadialGradient(x, y, 0, x, y, nodeRadius * 2);
            grad.addColorStop(0, color + "25");
            grad.addColorStop(1, "transparent");
            ctx!.beginPath();
            ctx!.arc(x, y, nodeRadius * 2 * pulse, 0, Math.PI * 2);
            ctx!.fillStyle = grad;
            ctx!.fill();
          }

          // Node
          ctx!.beginPath();
          ctx!.arc(x, y, nodeRadius, 0, Math.PI * 2);
          ctx!.fillStyle = "#080d16";
          ctx!.fill();
          ctx!.strokeStyle = isHighlight ? color : color + "50";
          ctx!.lineWidth = isHighlight ? 2 : 1;
          ctx!.stroke();

          // Inner
          ctx!.beginPath();
          ctx!.arc(x, y, 5, 0, Math.PI * 2);
          ctx!.fillStyle = color;
          ctx!.globalAlpha = animating ? pulse : 0.7;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        }

        // Layer label
        const lx = layerPositions[li][0].x;
        ctx!.font = `9px var(--font-inter, system-ui)`;
        ctx!.fillStyle = "#4a5568";
        ctx!.textAlign = "center";
        ctx!.fillText(LAYERS[li].label, lx, height - 10);
      }

      t += 1;
      if (animating) frameRef.current = requestAnimationFrame(draw);
    }

    if (animating) {
      frameRef.current = requestAnimationFrame(draw);
    } else {
      draw();
    }

    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height, highlightLayer, animating]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full"
      aria-label="Neural network diagram"
    />
  );
}
