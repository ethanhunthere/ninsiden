import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn AI — Roadmap",
  description: "A structured AI learning roadmap — from programming basics to LLM product engineering.",
};

const ROADMAP = [
  {
    num: "01",
    title: "Programming Basics",
    what: "Variables, loops, functions, data structures, control flow.",
    why: "Every AI system is code. You need the foundation before touching models.",
    build: "Build a command-line number guessing game with user input and loops.",
    color: "#00d4ff",
  },
  {
    num: "02",
    title: "Python",
    what: "Python syntax, OOP, list comprehensions, file I/O, virtual environments.",
    why: "Python is the dominant language for ML, data science, and AI engineering.",
    build: "Build a CSV data analyser that computes basic statistics.",
    color: "#00d4ff",
  },
  {
    num: "03",
    title: "NumPy",
    what: "Vectors, matrices, broadcasting, dot products, element-wise ops.",
    why: "NumPy is the computational foundation for ML. Understand arrays before tensors.",
    build: "Implement matrix multiplication and softmax from scratch with NumPy.",
    color: "#8b5cf6",
  },
  {
    num: "04",
    title: "Linear Algebra",
    what: "Vectors, dot products, matrix multiplication, eigenvalues, SVD.",
    why: "Linear algebra is the mathematics of neural networks and embeddings.",
    build: "Implement a 2D transformation visualiser showing rotations and scaling.",
    color: "#8b5cf6",
  },
  {
    num: "05",
    title: "Probability & Statistics",
    what: "Probability, distributions, Bayes' theorem, entropy, KL divergence.",
    why: "LLMs are probabilistic systems. Loss functions, sampling, and logits all require this.",
    build: "Implement a Naive Bayes text classifier from scratch.",
    color: "#8b5cf6",
  },
  {
    num: "06",
    title: "Machine Learning",
    what: "Supervised/unsupervised learning, train/val/test split, overfitting, regularisation.",
    why: "Neural networks are a subset of ML. You need the broader context.",
    build: "Train a logistic regression model on a binary classification dataset.",
    color: "#00d4ff",
  },
  {
    num: "07",
    title: "Neural Networks",
    what: "Perceptrons, dense layers, activations (ReLU, Sigmoid, Tanh), forward pass.",
    why: "The core building block of all modern AI systems.",
    build: "Build a 2-layer neural network from scratch using only NumPy.",
    color: "#00d4ff",
  },
  {
    num: "08",
    title: "Backpropagation",
    what: "Chain rule, gradient computation, vanishing/exploding gradients.",
    why: "Backprop is how networks learn. Understanding it separates practitioners from users.",
    build: "Implement backpropagation manually for a 2-layer network, verify with numerical gradients.",
    color: "#8b5cf6",
  },
  {
    num: "09",
    title: "Optimisation",
    what: "SGD, momentum, Adam, learning rate schedules, batch size effects.",
    why: "Choosing the right optimizer and hyperparameters directly determines model quality.",
    build: "Compare SGD vs Adam on a noisy regression task. Plot loss curves.",
    color: "#8b5cf6",
  },
  {
    num: "10",
    title: "Transformers",
    what: "Attention mechanism, multi-head attention, positional encoding, encoder/decoder.",
    why: "Every major LLM — GPT, Claude, Gemini — is a Transformer variant.",
    build: "Implement scaled dot-product attention in pure Python/NumPy.",
    color: "#10b981",
  },
  {
    num: "11",
    title: "RAG",
    what: "Embeddings, vector databases, semantic search, chunk selection, context injection.",
    why: "RAG is the dominant pattern for building LLM apps that work with private/recent data.",
    build: "Build a local Q&A system that retrieves from a document collection using embeddings.",
    color: "#10b981",
  },
  {
    num: "12",
    title: "AI Agents",
    what: "Tool use, function calling, multi-step reasoning, agent loops, scratchpad.",
    why: "Agents are the next layer above RAG — AI that can take actions, not just answer questions.",
    build: "Build an agent that can use a calculator and web search tool to answer math questions.",
    color: "#10b981",
  },
  {
    num: "13",
    title: "LLM Product Engineering",
    what: "Prompt engineering, streaming APIs, SSE, FastAPI, eval frameworks, cost management.",
    why: "Knowing the theory is not enough. Production AI products require full-stack engineering.",
    build: "Deploy a streaming RAG API with FastAPI and connect it to a Next.js frontend.",
    color: "#00d4ff",
  },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient">AI Learning Roadmap</span>
          </h1>
          <p className="text-foreground/50 text-lg max-w-2xl mx-auto">
            From programming basics to building production LLM applications — a structured path
            through the concepts that matter.
          </p>
        </div>

        <div className="space-y-4">
          {ROADMAP.map((item, i) => (
            <div
              key={item.num}
              className="glass-panel p-5 grid md:grid-cols-[64px_1fr_1fr_1fr] gap-4 items-start"
              style={{ borderColor: item.color + "20" }}
            >
              {/* Number */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-2xl font-bold font-mono"
                  style={{ color: item.color }}
                >
                  {item.num}
                </span>
                {i < ROADMAP.length - 1 && (
                  <div className="w-px h-4 mt-1" style={{ backgroundColor: item.color + "20" }} />
                )}
              </div>

              {/* Title + What */}
              <div>
                <h3 className="text-sm font-bold text-foreground/90 mb-1.5">{item.title}</h3>
                <p className="text-[11px] text-foreground/50 leading-relaxed">{item.what}</p>
              </div>

              {/* Why */}
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Why</p>
                <p className="text-[11px] text-foreground/50 leading-relaxed">{item.why}</p>
              </div>

              {/* Build */}
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Build</p>
                <p className="text-[11px] text-foreground/50 leading-relaxed">{item.build}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
