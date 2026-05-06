"use client";

import { motion } from "framer-motion";

const SECTIONS = [
  {
    id: "what",
    label: "A. What is NInsideN?",
    heading: "A visual trace lab for AI pipelines",
    body: "NInsideN is a visual trace lab that shows how AI applications process prompts, retrieve context, and stream answers. It renders the observable, application-level pipeline — not hidden model weights or private reasoning — so you can watch every step from input to output.",
    color: "cyan",
  },
  {
    id: "why",
    label: "B. Why AI feels like magic",
    heading: "Most chatbots hide the process",
    body: "Standard AI chat interfaces show a blinking cursor and then a response. NInsideN reveals what happened in between: normalisation, tokenisation, intent classification, retrieval, context building, model request, and token streaming. The pipeline becomes transparent.",
    color: "violet",
  },
  {
    id: "who",
    label: "D. Built for learners and builders",
    heading: "Understand how real AI products work",
    body: "Beginners can learn AI visually through animated pipeline steps. Developers can understand RAG and LLM application architecture. Students can see tokens, context windows, and model flow. Builders can study how production AI products are assembled and deployed.",
    color: "green",
  },
];

const colorVariants = {
  cyan: {
    border: "border-accent-cyan/20",
    badge: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20",
    heading: "text-accent-cyan",
  },
  violet: {
    border: "border-accent-violet/20",
    badge: "bg-accent-violet/10 text-accent-violet border-accent-violet/20",
    heading: "text-accent-violet",
  },
  green: {
    border: "border-accent-green/20",
    badge: "bg-accent-green/10 text-accent-green border-accent-green/20",
    heading: "text-accent-green",
  },
};

export function ProductSections() {
  return (
    <section className="py-20 border-t border-panel-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {SECTIONS.map((sec, i) => {
            const c = colorVariants[sec.color as keyof typeof colorVariants];
            return (
              <motion.div
                key={sec.id}
                className={`glass-panel p-6 border ${c.border}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border mb-4 ${c.badge}`}>
                  {sec.label}
                </span>
                <h3 className={`text-lg font-semibold mb-3 ${c.heading}`}>{sec.heading}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{sec.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
