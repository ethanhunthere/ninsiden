# NInsideN — Neural Inside Network

> **See AI From The Inside.**

NInsideN is a premium AI visualisation platform where users type a prompt and watch the full
observable application-level pipeline: normalisation → tokenisation → intent detection →
retrieval → context building → model request → streamed tokens → final answer.

**Live at:** [ninsiden.com](https://ninsiden.com)

---

## What It Is

NInsideN is a **visual trace lab**. It shows how AI applications process prompts, retrieve
context, and stream answers — not hidden model reasoning, but the real, transparent pipeline
that surrounds the model.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS · Framer Motion |
| Backend | Python · FastAPI · Server-Sent Events |
| AI API | OpenRouter (OpenAI-compatible chat completions) |
| Deployment | Vercel |

---

## Local Development

### 1 — Install frontend

```bash
npm install
```

### 2 — Set up environment

```bash
cp .env.example .env.local
# Edit .env.local — add OPENROUTER_API_KEY if you have one
```

### 3 — Install backend

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 4a — Run with Vercel CLI (recommended)

```bash
npm install -g vercel
vercel dev
```

### 4b — Run separately

```bash
# Terminal 1 (backend)
cd api && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 (frontend) — add BACKEND_URL=http://localhost:8000 to .env.local
npm run dev
```

---

## Deploy to Vercel

```bash
vercel
```

Add environment variables in Vercel Project Settings:
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` → `openrouter/auto`
- `SITE_URL` → `https://ninsiden.com`
- `SITE_NAME` → `NInsideN`

### Custom domain

1. Vercel Project Settings → Domains → Add `ninsiden.com` + `www.ninsiden.com`
2. Copy DNS records → paste into domain registrar
3. Wait for propagation, verify HTTPS

---

## API Endpoints

`GET /api/health` — health check  
`POST /api/trace` — SSE trace stream

---

## Honesty Policy

- Sources labelled: `local demo knowledge — no live web search configured`
- No private model reasoning is exposed — only the observable application pipeline
- OpenRouter API key missing → polished local fallback (UI fully works)

---

NInsideN — Neural Inside Network. Built to make AI visible.

---

## Original Neural Network Lab (Python/NumPy)

The original Streamlit neural network lab is preserved in `app.py` and `src/`.

```bash
# Original lab:
pip install -r requirements.txt
streamlit run app.py
```

---



**No PyTorch. No TensorFlow. Real math, real code, real understanding.**

---

## What This Is

Neural Network Lab is an interactive Streamlit application that lets you:

- Train neural networks on toy datasets and watch them learn in real time
- Visualize decision boundaries, loss curves, weight distributions, and gradient norms
- Trace a single forward and backward pass step-by-step
- Understand every equation and algorithm from first principles

This is not a tutorial you read passively. This is a lab where you run experiments.

---

## Stack

| Component | Library |
|-----------|---------|
| Neural network engine | NumPy (from scratch) |
| Interactive UI | Streamlit |
| Visualizations | Plotly + Matplotlib |
| Toy datasets | scikit-learn |
| Tests | pytest |

---

## Setup (Linux / Kali)

```bash
# 1. Clone or open the project folder
cd /path/to/neural-network-lab

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the tests to verify everything works
pytest

# 5. Launch the app
streamlit run app.py
```

The app will open at `http://localhost:8501`.

---

## Project Structure

```
neural-network-lab/
│
├── app.py                        ← Main Streamlit application
├── requirements.txt
├── README.md
│
├── src/
│   ├── nn/
│   │   ├── activations.py        ← ReLU, Sigmoid, Tanh, Softmax, Linear
│   │   ├── layers.py             ← Dense layer (forward + backward)
│   │   ├── losses.py             ← MSE, Binary Cross-Entropy, Categorical CE
│   │   ├── optimizers.py         ← SGD, SGD+Momentum, Adam
│   │   ├── network.py            ← NeuralNetwork class (assembles layers)
│   │   └── training.py           ← Trainer class and mini-batch loop
│   │
│   ├── data/
│   │   └── toy_datasets.py       ← XOR, Circles, Moons, Spiral, Linear, Blobs
│   │
│   ├── visualization/
│   │   └── plots.py              ← All Plotly/Matplotlib chart functions
│   │
│   ├── experiments/
│   │   ├── xor_experiment.py     ← Run XOR from the terminal
│   │   ├── spiral_experiment.py  ← Run Spiral from the terminal
│   │   └── moons_experiment.py   ← Run Moons from the terminal
│   │
│   └── utils/
│       └── math_notes.py         ← Derivations + numerical gradient check
│
└── tests/
    ├── test_forward.py           ← Shape and value tests for forward pass
    ├── test_losses.py            ← Loss function correctness tests
    └── test_training.py          ← Convergence and gradient correctness tests
```

---

## What Files to Study First

| Order | File | Why |
|-------|------|-----|
| 1 | `src/nn/activations.py` | Understand the non-linearities |
| 2 | `src/nn/layers.py` | The core forward + backward math |
| 3 | `src/nn/losses.py` | How we measure error |
| 4 | `src/nn/network.py` | How layers chain together |
| 5 | `src/nn/optimizers.py` | How weights get updated |
| 6 | `src/nn/training.py` | The full training loop |
| 7 | `src/utils/math_notes.py` | The equations with explanations |
| 8 | `app.py` | The interactive interface |

---

## Run Experiments from Terminal

```bash
# XOR problem
python3 src/experiments/xor_experiment.py

# Spiral (3-class)
python3 src/experiments/spiral_experiment.py

# Moons with train/val split
python3 src/experiments/moons_experiment.py

# Print all math notes/derivations
python3 src/utils/math_notes.py
```

---

## Learning Roadmap

### Phase 1 — Understand the Building Blocks
1. Read `activations.py` — what does `relu.forward(z)` and `relu.backward(dA)` actually compute?
2. Read `layers.py` — trace through the `forward()` and `backward()` methods line by line
3. Run `python3 src/utils/math_notes.py` to see the equations

### Phase 2 — See It Visually
1. Launch `streamlit run app.py`
2. Select dataset: **Moons**
3. Set 1 hidden layer, 4 neurons, ReLU
4. Train for 200 epochs — watch the decision boundary form
5. Then increase to 16 neurons and retrain — compare

### Phase 3 — Trace a Forward/Backward Pass
1. Go to **Step-by-Step Mode** in the app
2. Pick a sample index
3. Follow the values: input → Z → activation → prediction → loss → gradients

### Phase 4 — Experiment
Try these experiments and observe what happens:

| Experiment | What to change | What to observe |
|------------|---------------|----------------|
| XOR problem | Set 0 hidden layers | Does it converge? Why not? |
| Vanishing gradients | Use Sigmoid in all layers, deep network | Watch gradient norms shrink to zero |
| Learning rate effect | SGD with lr=0.001 vs 0.5 | Slow vs oscillating loss curve |
| Overfitting | Too many neurons, few samples, many epochs | Train acc >> Val acc |
| Optimizer comparison | SGD vs Adam on Spiral | Compare convergence speed |

### Phase 5 — Modify the Code
See the exercises section below.

---

## Exercises

These exercises will solidify your understanding. Each requires modifying actual code.

**Exercise 1 — Leaky ReLU**
Add a `LeakyReLU` class to `activations.py`.
- Forward: `f(z) = z if z > 0 else 0.01 * z`
- Backward: `f'(z) = 1 if z > 0 else 0.01`
- Register it in `ACTIVATIONS` and test it in the app.

**Exercise 2 — L2 Regularization**
Modify `layers.py` to accept a `lambda_l2` parameter.
- During backward: add `lambda_l2 * W` to `dW`
- This penalizes large weights and reduces overfitting

**Exercise 3 — Batch Normalization**
Add a `BatchNorm` layer to `layers.py`.
- Forward: normalize Z to zero mean and unit variance, then scale and shift
- Backward: derive the gradient (harder — look up the formula)

**Exercise 4 — Dropout**
Add a `Dropout` layer.
- Forward (training): randomly zero out neurons with probability `p`
- Forward (inference): multiply by `(1-p)` scaling
- Backward: pass gradient only through non-zeroed neurons

**Exercise 5 — Learning Rate Decay**
Modify `Trainer` to reduce the learning rate by a factor after each epoch.
- Add a `lr_decay` parameter to `Trainer`
- After each epoch: `optimizer.lr *= (1 - lr_decay)`

**Exercise 6 — Early Stopping**
Add early stopping to `Trainer`.
- Monitor `val_loss`
- If it doesn't improve for `patience` consecutive epochs, stop training
- Restore the best weights

---

## Suggested Next Steps After This Project

1. **Implement CNNs** — add `Conv2D` and `MaxPool2D` layers, test on MNIST
2. **Implement RNNs** — add a `SimpleRNN` layer for sequence data
3. **Study PyTorch** — compare its `autograd` system with your manual backprop
4. **Read "Deep Learning" by Goodfellow, Bengio, Courville** — the definitive textbook
5. **Implement a transformer** — the attention mechanism is just matrix operations
6. **Try Kaggle competitions** — apply what you've learned on real data

---

## Key Concepts Quick Reference

| Concept | One-liner |
|---------|-----------|
| Neuron | z = w·x + b, a = activation(z) |
| Layer | Group of neurons processing the same input |
| Weights | Learnable scalars on connections |
| Bias | Shift parameter, allows offset from origin |
| Activation | Non-linear function preventing layer collapse |
| Loss | Scalar measuring prediction error |
| Gradient | Direction of steepest increase in loss |
| Backprop | Chain rule applied backwards through layers |
| Gradient descent | W = W - lr × gradient |
| Overfitting | Memorizing train data, failing on new data |
| Learning rate | Step size for weight updates |

---

## Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_training.py -v

# Run a specific test
pytest tests/test_training.py::TestTrainingConvergence::test_loss_decreases_on_xor -v
```

The gradient correctness test (`test_gradients_correct_on_small_network`) uses numerical differentiation to verify that your backpropagation implementation is mathematically correct.

---

## License

MIT — learn freely, modify freely, share freely.
