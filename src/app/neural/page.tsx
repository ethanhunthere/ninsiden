"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NeuralNetworkVisual } from "@/components/visualizers/NeuralNetworkVisual";
import { BackpropVisual } from "@/components/visualizers/BackpropVisual";
import { GradientFlowVisual } from "@/components/visualizers/GradientFlowVisual";
import { Button } from "@/components/ui/Button";

const ACTIVATION_FUNS = [
  {
    id: "relu",
    label: "ReLU",
    desc: "max(0, x) — outputs zero for negative inputs, linear for positive. Prevents gradient vanishing for positive activations.",
    color: "#00e5ff",
  },
  {
    id: "sigmoid",
    label: "Sigmoid",
    desc: "1 / (1 + e^(-x)) — squishes output to (0, 1). Used in binary classification outputs. Prone to vanishing gradients.",
    color: "#9d7aff",
  },
  {
    id: "tanh",
    label: "Tanh",
    desc: "(e^x - e^(-x)) / (e^x + e^(-x)) — zero-centred, range (-1, 1). Generally preferred over sigmoid for hidden layers.",
    color: "#00e5a0",
  },
];

const CONCEPTS = [
  {
    title: "What is a neuron?",
    body: "A neuron is a computational unit that takes weighted inputs, adds a bias, and passes the sum through an activation function. It is the fundamental building block of every neural network.",
  },
  {
    title: "What are weights?",
    body: "Weights are learned parameters that control the strength of connections between neurons. During training, the optimizer adjusts weights to reduce prediction error.",
  },
  {
    title: "What is bias?",
    body: "Bias is an extra learnable parameter added before the activation function. It allows the neuron to shift its activation threshold independently of input values.",
  },
  {
    title: "What is activation?",
    body: "An activation function introduces non-linearity, allowing networks to learn complex patterns. Without activation functions, a stack of layers would collapse to a single linear transformation.",
  },
  {
    title: "What is loss?",
    body: "Loss measures how wrong the network's predictions are. Common loss functions: Mean Squared Error for regression, Cross-Entropy for classification. Lower loss = better predictions.",
  },
  {
    title: "How learning updates weights?",
    body: "The optimizer computes gradients of the loss w.r.t. each weight, then nudges weights in the direction that reduces loss. Learning rate controls step size. This repeats across all training examples.",
  },
];

export default function NeuralPage() {
  const [activation, setActivation] = useState("relu");
  const [highlightLayer, setHighlightLayer] = useState<number | undefined>(undefined);

  const act = ACTIVATION_FUNS.find((a) => a.id === activation)!;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(157,122,255,0.05) 0%, transparent 60%)" }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="mb-14 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted mb-5">Interactive</p>
          <h1
            className="font-bold text-gradient mb-5 tracking-tight leading-tight"
            style={{ fontSize: "var(--text-display)" }}
          >
            Neural Network Lab
          </h1>
          <p className="text-foreground-dim text-lg">
            Interactive visual neural network learning — no black boxes.
          </p>
        </div>

        {/* Network visual + controls */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="glass-panel p-4 mb-4">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Live Network</p>
              <NeuralNetworkVisual height={260} highlightLayer={highlightLayer} animating />
              <div className="flex flex-wrap gap-2 mt-3">
                {[0, 1, 2, 3].map((l) => (
                  <Button
                    key={l}
                    size="sm"
                    variant={highlightLayer === l ? "primary" : "ghost"}
                    onClick={() => setHighlightLayer(highlightLayer === l ? undefined : l)}
                  >
                    {["Input", "Hidden 1", "Hidden 2", "Output"][l]}
                  </Button>
                ))}
              </div>
            </div>
            <GradientFlowVisual />
          </div>

          <div className="flex flex-col gap-4">
            {/* Activation selector */}
            <div className="glass-panel p-4">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-3">
                Activation Function
              </p>
              <div className="flex gap-2 mb-4">
                {ACTIVATION_FUNS.map((a) => (
                  <Button
                    key={a.id}
                    size="sm"
                    variant={activation === a.id ? "primary" : "ghost"}
                    onClick={() => setActivation(a.id)}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
              <div
                className="p-3 rounded-lg border text-sm"
                style={{ borderColor: act.color + "30", backgroundColor: act.color + "08" }}
              >
                <p className="font-semibold mb-1" style={{ color: act.color }}>
                  {act.label}
                </p>
                <p className="text-xs text-foreground/60 leading-relaxed">{act.desc}</p>
              </div>
            </div>

            <BackpropVisual />
          </div>
        </div>

        {/* Concept cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONCEPTS.map((c, i) => (
            <motion.div
              key={c.title}
              className="glass-panel p-4"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <h3 className="text-sm font-semibold text-accent-cyan mb-2">{c.title}</h3>
              <p className="text-xs text-foreground/60 leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
