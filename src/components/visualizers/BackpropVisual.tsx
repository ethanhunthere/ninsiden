"use client";

import { useState } from "react";
import { NeuralNetworkVisual } from "./NeuralNetworkVisual";
import { Button } from "@/components/ui/Button";

const PHASES = [
  {
    id: "forward",
    label: "Forward Pass",
    highlight: 0,
    desc: "Inputs travel left to right through the network, each layer computing a weighted sum and activation.",
  },
  {
    id: "hidden1",
    label: "Hidden Layer 1",
    highlight: 1,
    desc: "Neurons in the first hidden layer detect low-level patterns. Each applies weights, adds bias, and passes through an activation function.",
  },
  {
    id: "hidden2",
    label: "Hidden Layer 2",
    highlight: 2,
    desc: "Deeper patterns are combined here. The network learns increasingly abstract features with each layer.",
  },
  {
    id: "output",
    label: "Output",
    highlight: 3,
    desc: "The final layer produces the prediction. Loss is computed against the ground truth.",
  },
  {
    id: "backward",
    label: "Backward Pass",
    highlight: 2,
    desc: "Backpropagation sends gradient signals backwards through all layers, calculating how each weight contributed to the error.",
  },
];

export function BackpropVisual() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const phase = PHASES[phaseIdx];

  return (
    <div className="rounded-xl bg-panel border border-panel-border p-5">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Backpropagation Trace</p>

      <NeuralNetworkVisual height={220} highlightLayer={phase.highlight} animating={false} />

      <div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/6 min-h-[64px]">
        <p className="text-xs font-semibold text-accent-cyan mb-1">{phase.label}</p>
        <p className="text-[11px] text-foreground/60 leading-relaxed">{phase.desc}</p>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPhaseIdx((i) => Math.max(0, i - 1))}
          disabled={phaseIdx === 0}
        >
          ← Back
        </Button>
        <div className="flex-1 flex justify-center gap-1">
          {PHASES.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: i === phaseIdx ? "#00e5ff" : "#16213a" }}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPhaseIdx((i) => Math.min(PHASES.length - 1, i + 1))}
          disabled={phaseIdx === PHASES.length - 1}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
