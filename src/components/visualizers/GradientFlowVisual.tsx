"use client";

import { useEffect, useRef } from "react";

export function GradientFlowVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const points = 60;
    let t = 0;

    function lossLandscape(x: number, shift: number): number {
      return (
        0.4 * Math.sin(x * 0.8 + shift) +
        0.3 * Math.sin(x * 2.2 + shift * 0.5) +
        0.15 * Math.sin(x * 5 + shift * 0.3) +
        0.5
      );
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Draw loss surface
      ctx!.beginPath();
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * W;
        const y = H * 0.15 + lossLandscape(i / points * 8, 0) * H * 0.55;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(139,92,246,0.5)";
      ctx!.lineWidth = 2;
      ctx!.stroke();

      // Fill under
      ctx!.lineTo(W, H);
      ctx!.lineTo(0, H);
      ctx!.closePath();
      ctx!.fillStyle = "rgba(139,92,246,0.04)";
      ctx!.fill();

      // Gradient descent ball
      const ballX = (((t * 0.003) % 1 + 1) % 1) * W;
      const ballI = Math.round((ballX / W) * points);
      const ballY = H * 0.15 + lossLandscape((ballX / W) * 8, 0) * H * 0.55;

      // Glow
      const grd = ctx!.createRadialGradient(ballX, ballY, 0, ballX, ballY, 16);
      grd.addColorStop(0, "rgba(0,212,255,0.5)");
      grd.addColorStop(1, "transparent");
      ctx!.beginPath();
      ctx!.arc(ballX, ballY, 16, 0, Math.PI * 2);
      ctx!.fillStyle = grd;
      ctx!.fill();

      // Ball
      ctx!.beginPath();
      ctx!.arc(ballX, ballY, 5, 0, Math.PI * 2);
      ctx!.fillStyle = "#00d4ff";
      ctx!.fill();

      // Arrow showing gradient direction
      const nextX = Math.min(W, ballX + 20);
      const nextY = H * 0.15 + lossLandscape((nextX / W) * 8, 0) * H * 0.55;
      const dx = nextX - ballX;
      const dy = nextY - ballY;

      ctx!.beginPath();
      ctx!.moveTo(ballX, ballY);
      ctx!.lineTo(ballX + dx * 0.6, ballY + dy * 0.6);
      ctx!.strokeStyle = "rgba(0,212,255,0.7)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Labels
      ctx!.font = "9px var(--font-inter, system-ui)";
      ctx!.fillStyle = "#4a5568";
      ctx!.textAlign = "left";
      ctx!.fillText("High loss", 4, 18);
      ctx!.fillText("Low loss", 4, H - 6);
      ctx!.textAlign = "right";
      ctx!.fillStyle = "#00d4ff";
      ctx!.fillText("← Gradient descent", W - 4, ballY - 10);

      t += 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="rounded-xl bg-panel border border-panel-border p-4">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Gradient Descent</p>
      <canvas
        ref={canvasRef}
        width={300}
        height={160}
        className="w-full"
        aria-label="Gradient descent visualisation"
      />
      <p className="text-[10px] text-muted mt-2">
        The model moves along the loss landscape in the direction that reduces error.
      </p>
    </div>
  );
}
