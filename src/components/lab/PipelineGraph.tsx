"use client";

import { motion } from "framer-motion";
import type { PipelineNodeId } from "@/lib/trace/types";
import { PIPELINE_NODES } from "@/lib/trace/constants";
import { cn } from "@/lib/utils";

interface PipelineGraphProps {
  activeNode: PipelineNodeId | null;
  completedNodes: Set<PipelineNodeId>;
  status: "idle" | "running" | "completed" | "error";
}

const NODE_COLORS: Record<string, { idle: string; active: string; done: string }> = {
  prompt:    { idle: "#16213a", active: "#00e5ff", done: "#00b3cc" },
  tokens:    { idle: "#16213a", active: "#9d7aff", done: "#7c5ccc" },
  intent:    { idle: "#16213a", active: "#9d7aff", done: "#7c5ccc" },
  retrieval: { idle: "#16213a", active: "#00e5ff", done: "#00b3cc" },
  context:   { idle: "#16213a", active: "#9d7aff", done: "#7c5ccc" },
  model:     { idle: "#16213a", active: "#9d7aff", done: "#7c5ccc" },
  stream:    { idle: "#16213a", active: "#00e5a0", done: "#00b87d" },
  answer:    { idle: "#16213a", active: "#00e5a0", done: "#00b87d" },
};

export function PipelineGraph({ activeNode, completedNodes, status }: PipelineGraphProps) {
  const W = 640;
  const H = 140;
  const nodeCount = PIPELINE_NODES.length;
  const padX = 44;
  const spacing = (W - padX * 2) / (nodeCount - 1);
  const cy = H / 2;

  const positions = PIPELINE_NODES.map((node, i) => ({
    ...node,
    x: padX + i * spacing,
    y: cy,
  }));

  return (
    <div className="w-full rounded-xl bg-panel border border-panel-border overflow-hidden">
      <div className="px-4 py-2 border-b border-panel-border flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-glow-sm-cyan" />
        <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
          Observable Pipeline
        </span>
        {status === "running" && (
          <span className="flex items-center gap-1 text-[10px] text-accent-cyan ml-auto">
            <span className="status-dot status-dot-live" />
            Live
          </span>
        )}
        {status === "completed" && (
          <span className="flex items-center gap-1 text-[10px] text-accent-green ml-auto">
            <span className="status-dot status-dot-done" />
            Completed
          </span>
        )}
      </div>

      <div className="p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 480, height: 140 }}
          aria-label="AI pipeline visualisation"
        >
          {/* Connections */}
          {positions.slice(0, -1).map((node, i) => {
            const next = positions[i + 1];
            const isDone =
              completedNodes.has(node.id) && completedNodes.has(next.id);
            const isActive =
              activeNode === node.id || activeNode === next.id;

            return (
              <g key={`edge-${node.id}`}>
                {/* Base line */}
                <line
                  x1={node.x + 20}
                  y1={node.y}
                  x2={next.x - 20}
                  y2={next.y}
                  stroke={isDone ? "#1e4060" : "#1a1d2e"}
                  strokeWidth={1.5}
                />
                {/* Animated dash when active */}
                {isActive && (
                  <motion.line
                    x1={node.x + 20}
                    y1={node.y}
                    x2={next.x - 20}
                    y2={next.y}
                    stroke="#00e5ff"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    initial={{ strokeDashoffset: 40 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {positions.map((node) => {
            const isActive = activeNode === node.id;
            const isDone = completedNodes.has(node.id);
            const colors = NODE_COLORS[node.id] ?? NODE_COLORS.prompt;
            const fill = isActive ? colors.active : isDone ? colors.done : colors.idle;
            const strokeColor = isActive
              ? colors.active
              : isDone
              ? colors.done + "80"
              : "#2a2d3e";

            return (
              <g key={node.id}>
                {/* Glow */}
                {(isActive || isDone) && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={28}
                    fill={fill + "15"}
                    initial={{ r: 24, opacity: 0 }}
                    animate={{
                      r: isActive ? [24, 32, 24] : 28,
                      opacity: isActive ? [0.5, 0.8, 0.5] : 0.3,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: isActive ? Infinity : 0,
                    }}
                  />
                )}

                {/* Circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={18}
                  fill="#080d16"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 2 : 1.5}
                  animate={{ stroke: strokeColor }}
                  transition={{ duration: 0.3 }}
                />

                {/* Inner dot */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={6}
                  fill={isDone || isActive ? fill : "#2a2d3e"}
                  animate={{ fill: isDone || isActive ? fill : "#2a2d3e" }}
                  transition={{ duration: 0.3 }}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isActive ? fill : isDone ? fill + "cc" : "#4a5568"}
                  fontFamily="var(--font-inter, system-ui)"
                  fontWeight={isActive ? "600" : "400"}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 43}
                  textAnchor="middle"
                  fontSize={7.5}
                  fill="#2a3040"
                  fontFamily="var(--font-inter, system-ui)"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
