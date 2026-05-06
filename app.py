"""
Neural Network Lab — Interactive Streamlit Application

This is the main entry point. Run with:
  streamlit run app.py

Navigation:
  🧪 Train & Explore   — configure and train a network, watch it learn
  🔬 Step-by-Step      — trace one forward/backward pass in detail
  📚 Concepts          — educational explanations of every concept
  🧮 Math Notes        — the actual equations with derivations
"""

import streamlit as st
import numpy as np
import time

# ─── Page configuration ───────────────────────────────────────────────────────
st.set_page_config(
    page_title="Neural Network Lab",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Imports ──────────────────────────────────────────────────────────────────
from src.nn import (
    NeuralNetwork, Dense, ReLU, Sigmoid, Tanh, Softmax, Linear,
    SGD, SGDMomentum, Adam,
    get_activation, get_optimizer,
    Trainer,
)
from src.data.toy_datasets import (
    make_xor, make_circles, make_moons, make_spiral,
    make_linear, make_gaussian_blobs, normalize, train_test_split, DATASETS,
)
from src.visualization.plots import (
    plot_training_curves,
    plot_decision_boundary,
    plot_weight_distributions,
    plot_gradient_norms,
    plot_layer_activations,
    plot_weight_heatmap,
)
from src.utils.math_notes import NOTES


# ─── CSS ──────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .concept-box {
        background: #1a1a2e;
        border-left: 4px solid #4ecca3;
        padding: 1rem 1.5rem;
        border-radius: 0 8px 8px 0;
        margin: 0.5rem 0 1.5rem 0;
    }
    .step-box {
        background: #16213e;
        border: 1px solid #0f3460;
        padding: 1rem;
        border-radius: 8px;
        margin: 0.5rem 0;
    }
    .metric-big {
        font-size: 2rem;
        font-weight: bold;
        color: #4ecca3;
    }
    .warning-box {
        background: #2d1b00;
        border-left: 4px solid #f39c12;
        padding: 0.75rem 1rem;
        border-radius: 0 8px 8px 0;
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def is_multiclass(dataset_name: str) -> bool:
    return dataset_name in ("Spiral (3-class)", "Gaussian Blobs")


def load_dataset(name: str, n_samples: int = 300, noise: float = 0.15) -> tuple:
    """Load and normalize the chosen dataset. Returns (X_train, X_val, y_train, y_val, X_all, y_all)."""
    if name == "XOR":
        X, y = make_xor(n_samples=n_samples, noise=noise)
    elif name == "Circles":
        X, y = make_circles(n_samples=n_samples, noise=noise)
    elif name == "Moons":
        X, y = make_moons(n_samples=n_samples, noise=noise)
    elif name == "Spiral (3-class)":
        X, y = make_spiral(n_samples=n_samples)
    elif name == "Linear":
        X, y = make_linear(n_samples=n_samples, noise=noise)
    else:  # Gaussian Blobs
        X, y = make_gaussian_blobs(n_samples=n_samples)

    X_norm, mean, std = normalize(X)
    X_train, X_val, y_train, y_val = train_test_split(X_norm, y, test_size=0.2)
    return X_train, X_val, y_train, y_val, X_norm, y


def build_network(
    dataset_name: str,
    n_hidden_layers: int,
    neurons_per_layer: int,
    activation_name: str,
    loss_name: str,
    optimizer_name: str,
    learning_rate: float,
) -> NeuralNetwork:
    """Build a NeuralNetwork based on sidebar configuration."""
    multiclass = is_multiclass(dataset_name)
    n_classes = 3 if multiclass else 1
    output_act = Softmax() if multiclass else Sigmoid()
    output_loss = "categorical_crossentropy" if multiclass else "bce"

    net = NeuralNetwork()
    in_size = 2

    for i in range(n_hidden_layers):
        act = get_activation(activation_name)
        init = "he" if activation_name == "relu" else "xavier"
        net.add(Dense(in_size, neurons_per_layer, activation=act, init=init,
                      name=f"Hidden{i+1}({activation_name},{neurons_per_layer})"))
        in_size = neurons_per_layer

    net.add(Dense(in_size, n_classes, activation=output_act, init="xavier",
                  name=f"Output({'Softmax' if multiclass else 'Sigmoid'},{n_classes})"))

    opt = get_optimizer(optimizer_name, learning_rate=learning_rate)
    net.compile(loss=output_loss, optimizer=opt)
    return net


# ─── Sidebar ──────────────────────────────────────────────────────────────────

def render_sidebar() -> dict:
    st.sidebar.title("🧠 Neural Network Lab")
    st.sidebar.markdown("---")

    page = st.sidebar.radio(
        "Navigate",
        ["🧪 Train & Explore", "🔬 Step-by-Step Mode", "📚 Concepts", "🧮 Math Notes"],
        label_visibility="collapsed",
    )

    st.sidebar.markdown("---")
    st.sidebar.subheader("Dataset")
    dataset_name = st.sidebar.selectbox("Choose dataset", list(DATASETS.keys()), index=2)
    n_samples = st.sidebar.slider("Samples", 100, 1000, 300, 50)
    noise = st.sidebar.slider("Noise level", 0.0, 0.5, 0.15, 0.05)

    st.sidebar.markdown("---")
    st.sidebar.subheader("Architecture")
    n_hidden = st.sidebar.slider("Hidden layers", 1, 4, 1)
    neurons = st.sidebar.slider("Neurons per layer", 2, 128, 16, 2)
    activation = st.sidebar.selectbox("Activation", ["relu", "tanh", "sigmoid"], index=0)

    st.sidebar.markdown("---")
    st.sidebar.subheader("Training")
    optimizer_name = st.sidebar.selectbox("Optimizer", ["adam", "sgd", "momentum"], index=0)
    lr = st.sidebar.select_slider(
        "Learning rate",
        options=[0.0001, 0.0003, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3],
        value=0.001,
    )
    epochs = st.sidebar.slider("Epochs", 10, 3000, 300, 10)
    batch_size = st.sidebar.select_slider("Batch size", options=[8, 16, 32, 64, 128, 256], value=32)

    return {
        "page": page,
        "dataset_name": dataset_name,
        "n_samples": n_samples,
        "noise": noise,
        "n_hidden": n_hidden,
        "neurons": neurons,
        "activation": activation,
        "optimizer_name": optimizer_name,
        "lr": lr,
        "epochs": epochs,
        "batch_size": batch_size,
    }


# ─── Page: Train & Explore ────────────────────────────────────────────────────

def page_train(cfg: dict):
    st.title("🧪 Train & Explore")
    st.markdown("Configure a network in the sidebar, then hit **Train**.")

    col_left, col_right = st.columns([1, 2])

    with col_left:
        st.subheader("Network Summary")
        multiclass = is_multiclass(cfg["dataset_name"])
        n_classes = 3 if multiclass else 1

        layers_desc = []
        in_s = 2
        for i in range(cfg["n_hidden"]):
            layers_desc.append(f"Dense({in_s} → {cfg['neurons']}, {cfg['activation'].upper()})")
            in_s = cfg["neurons"]
        layers_desc.append(f"Dense({in_s} → {n_classes}, {'Softmax' if multiclass else 'Sigmoid'})")

        for i, desc in enumerate(layers_desc):
            st.markdown(f"**Layer {i+1}:** `{desc}`")

        total_params = 0
        in_s = 2
        for i in range(cfg["n_hidden"]):
            total_params += in_s * cfg["neurons"] + cfg["neurons"]
            in_s = cfg["neurons"]
        total_params += in_s * n_classes + n_classes
        st.metric("Total parameters", total_params)

        st.markdown("---")
        st.markdown(f"**Dataset:** {cfg['dataset_name']}")
        st.markdown(f"**Optimizer:** {cfg['optimizer_name'].upper()} (lr={cfg['lr']})")
        st.markdown(f"**Batch size:** {cfg['batch_size']} | **Epochs:** {cfg['epochs']}")

    with col_right:
        train_btn = st.button("▶ Train Network", type="primary", use_container_width=True)

    if train_btn or ("trained_network" in st.session_state and st.session_state.get("cfg_hash") == str(cfg)):
        with st.spinner("Loading data..."):
            X_train, X_val, y_train, y_val, X_all, y_all = load_dataset(
                cfg["dataset_name"], cfg["n_samples"], cfg["noise"]
            )

        st.markdown("---")

        # ── Live training ──
        st.subheader("Live Training")
        progress_bar = st.progress(0)
        status_text = st.empty()
        loss_placeholder = st.empty()

        net = build_network(
            cfg["dataset_name"], cfg["n_hidden"], cfg["neurons"],
            cfg["activation"], "bce", cfg["optimizer_name"], cfg["lr"],
        )
        trainer = Trainer(net, batch_size=cfg["batch_size"], verbose=False)
        trainer._snapshot_every = max(1, cfg["epochs"] // 20)

        live_history: dict[str, list] = {"loss": [], "accuracy": [], "val_loss": [], "val_accuracy": []}
        update_every = max(1, cfg["epochs"] // 50)

        def epoch_cb(epoch, metrics):
            live_history["loss"].append(metrics["loss"])
            live_history["accuracy"].append(metrics["accuracy"])
            live_history["val_loss"].append(metrics["val_loss"])
            live_history["val_accuracy"].append(metrics["val_accuracy"])

            progress_bar.progress(epoch / cfg["epochs"])
            status_text.markdown(
                f"Epoch **{epoch}/{cfg['epochs']}** — "
                f"loss: `{metrics['loss']:.4f}` | acc: `{metrics['accuracy']:.4f}` | "
                f"val_acc: `{metrics['val_accuracy']:.4f}`"
            )
            if epoch % update_every == 0 or epoch == cfg["epochs"]:
                fig = plot_training_curves(live_history, "Training in Progress...")
                loss_placeholder.plotly_chart(fig, use_container_width=True, key=f"live_{epoch}")

        trainer.train(
            X_train, y_train,
            epochs=cfg["epochs"],
            X_val=X_val,
            y_val=y_val,
            epoch_callback=epoch_cb,
        )

        # Store trained network in session state
        st.session_state["trained_network"] = net
        st.session_state["trainer"] = trainer
        st.session_state["history"] = live_history
        st.session_state["X_all"] = X_all
        st.session_state["y_all"] = y_all
        st.session_state["cfg_hash"] = str(cfg)

        progress_bar.progress(1.0)
        status_text.success("✅ Training complete!")

        # ── Final metrics ──
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Final Loss", f"{live_history['loss'][-1]:.4f}")
        m2.metric("Train Accuracy", f"{live_history['accuracy'][-1]:.2%}")
        m3.metric("Val Loss", f"{live_history['val_loss'][-1]:.4f}")
        m4.metric("Val Accuracy", f"{live_history['val_accuracy'][-1]:.2%}")

        # Check for overfitting
        gap = live_history["accuracy"][-1] - live_history["val_accuracy"][-1]
        if gap > 0.07:
            st.markdown(
                f'<div class="warning-box">⚠️ <strong>Possible overfitting</strong>: '
                f'Train-val accuracy gap is {gap:.1%}. '
                f'The network may be memorizing training data. Try fewer neurons or fewer epochs.</div>',
                unsafe_allow_html=True,
            )

        # ── Visualizations ──
        st.markdown("---")
        tab1, tab2, tab3, tab4 = st.tabs(
            ["📈 Learning Curves", "🗺️ Decision Boundary", "⚖️ Weights", "📉 Gradients"]
        )

        with tab1:
            st.plotly_chart(
                plot_training_curves(live_history, "Final Learning Curves"),
                use_container_width=True,
            )
            st.markdown("""
            **Reading the curves:**
            - Loss should decrease smoothly → network is learning
            - Accuracy should increase → predictions improving
            - If val_loss rises while train_loss falls → overfitting
            """)

        with tab2:
            fig_db = plot_decision_boundary(net, X_all, y_all, f"Decision Boundary — {cfg['dataset_name']}")
            st.plotly_chart(fig_db, use_container_width=True)
            st.markdown("""
            **What you see:** Each colored region is where the network predicts a given class.
            The boundary between regions is the decision boundary — the line (or curve) the network learned.
            - Linear data → straight boundary
            - XOR/Circles/Moons → curved boundary (non-linearity at work)
            - Spiral → very complex, interleaved boundary
            """)

        with tab3:
            st.plotly_chart(plot_weight_distributions(net, "Weight Distributions"), use_container_width=True)
            st.markdown("**Healthy weights** are centered near zero. Very large or very small values indicate potential training issues.")

            st.markdown("#### Weight Heatmaps (per layer)")
            for layer in net.layers:
                st.plotly_chart(plot_weight_heatmap(layer, f"Weights: {layer.name}"), use_container_width=True)

        with tab4:
            if trainer.gradient_snapshots:
                st.plotly_chart(
                    plot_gradient_norms(trainer.gradient_snapshots, "Gradient Norms (sampled)"),
                    use_container_width=True,
                )
                st.markdown("""
                **Gradient norms** show how much each layer is learning at each snapshot.
                - Norms near zero → layer is not learning (vanishing gradients)
                - Exploding norms → learning rate too high, training unstable
                - All layers learning similarly → healthy training
                """)
            else:
                st.info("Train first to see gradient information.")


# ─── Page: Step-by-Step Mode ──────────────────────────────────────────────────

def page_step_by_step(cfg: dict):
    st.title("🔬 Step-by-Step Mode")
    st.markdown(
        "Trace exactly what happens for a single input sample through the network. "
        "A network must be trained first (or you can inspect an untrained one)."
    )

    if "trained_network" not in st.session_state:
        st.warning("No trained network found. Go to **Train & Explore** and train a network first, or use the button below to build an untrained one.")
        if st.button("Build untrained network for inspection"):
            X_train, X_val, y_train, y_val, X_all, y_all = load_dataset(cfg["dataset_name"], 200, 0.1)
            net = build_network(
                cfg["dataset_name"], cfg["n_hidden"], cfg["neurons"],
                cfg["activation"], "bce", cfg["optimizer_name"], cfg["lr"],
            )
            st.session_state["trained_network"] = net
            st.session_state["X_all"] = X_all
            st.session_state["y_all"] = y_all
            st.rerun()
        return

    net: NeuralNetwork = st.session_state["trained_network"]
    X_all = st.session_state["X_all"]
    y_all = st.session_state["y_all"]

    sample_idx = st.slider("Choose sample index to inspect", 0, len(X_all) - 1, 0)
    X_sample = X_all[sample_idx:sample_idx + 1]  # Keep shape (1, 2)
    y_sample = y_all[sample_idx:sample_idx + 1]

    # Run forward pass with step capture
    y_pred = net.forward(X_sample, capture_steps=True)
    step_cache = net.step_cache

    # Then backward
    loss_val = net.loss_fn.forward(y_pred, y_sample)
    net.backward(y_pred, y_sample)

    st.markdown("---")

    # ── Input ──
    st.subheader("① Input Data")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown('<div class="step-box">', unsafe_allow_html=True)
        st.markdown(f"**Feature 1 (x₁):** `{X_sample[0, 0]:.4f}`")
        st.markdown(f"**Feature 2 (x₂):** `{X_sample[0, 1]:.4f}`")
        if y_all.ndim > 1 and y_all.shape[1] > 1:
            st.markdown(f"**True label (one-hot):** `{y_sample[0]}`")
        else:
            st.markdown(f"**True label:** `{int(y_sample[0, 0])}`")
        st.markdown('</div>', unsafe_allow_html=True)
    with col2:
        st.markdown(
            '<div class="concept-box">The input to the network is a vector of features. '
            'For these 2D datasets, each sample has exactly 2 features, which is why our first layer has input size 2.</div>',
            unsafe_allow_html=True
        )

    # ── Layer-by-layer ──
    for i, cache in enumerate(step_cache):
        st.markdown(f"---")
        st.subheader(f"{'②③④⑤'[min(i,3)]} Layer {i+1}: {cache['layer_name']}")

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Weighted Sum (z = XW + b):**")
            z_vals = cache["Z"][0]
            st.code(f"z = {np.round(z_vals, 4)}")

            st.markdown(f"**After {cache['activation']} activation:**")
            a_vals = cache["A"][0]
            st.code(f"a = {np.round(a_vals, 4)}")

            st.markdown(f"**W shape:** `{cache['W'].shape}` | **b shape:** `{cache['b'].shape}`")

        with col2:
            layer_obj = net.layers[i]
            st.markdown(f"**Current weight stats:**")
            st.markdown(f"- Mean: `{cache['W'].mean():.4f}`")
            st.markdown(f"- Std: `{cache['W'].std():.4f}`")
            st.markdown(f"- Max: `{cache['W'].max():.4f}`")
            st.markdown(f"- Min: `{cache['W'].min():.4f}`")

    # ── Prediction and Loss ──
    st.markdown("---")
    st.subheader("⑤ Prediction & Loss")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"**Network output (ŷ):** `{np.round(y_pred[0], 4)}`")
        st.markdown(f"**Loss value:** `{loss_val:.6f}`")
        if y_all.ndim == 1 or y_all.shape[1] == 1:
            predicted_class = int(y_pred[0, 0] >= 0.5)
            true_class = int(y_sample[0, 0])
            correct = "✅ Correct" if predicted_class == true_class else "❌ Incorrect"
            st.markdown(f"**Predicted class:** {predicted_class} {correct}")
    with col2:
        st.markdown(
            '<div class="concept-box">The loss tells us how wrong the prediction is. '
            'A lower loss means the network\'s output is closer to the true label. '
            'The goal of training is to minimize this value across all samples.</div>',
            unsafe_allow_html=True,
        )

    # ── Gradients ──
    st.markdown("---")
    st.subheader("⑥ Gradients (Backpropagation)")
    st.markdown(
        "After computing the loss, we run backpropagation to find how much each weight "
        "contributed to the error. These gradients tell the optimizer which direction to adjust weights."
    )

    grad_snapshots = net.get_gradients_snapshot()
    for snap in grad_snapshots:
        with st.expander(f"Layer {snap['layer']+1}: {snap['name']}"):
            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"**||dW|| (gradient norm):** `{snap['dW_norm']:.6f}`")
                st.markdown(f"**||db|| (bias gradient norm):** `{snap['db_norm']:.6f}`")
            with col2:
                st.markdown(
                    "Large gradient norm → this layer needs a big update\n\n"
                    "Near-zero gradient norm → layer is not learning (possible vanishing gradient)"
                )
                if snap["dW_norm"] < 1e-6:
                    st.warning("⚠️ Gradient very small — possible vanishing gradient!")

    # ── Layer activation visualization ──
    if len(step_cache) > 0:
        st.markdown("---")
        st.subheader("⑦ Activation Values per Layer")
        fig = plot_layer_activations(step_cache, sample_idx=0)
        st.plotly_chart(fig, use_container_width=True)
        st.markdown(
            "Each bar shows the activation value of a neuron. "
            "With ReLU, many values are 0 (sparse). "
            "The final layer values become the class probabilities."
        )


# ─── Page: Concepts ───────────────────────────────────────────────────────────

CONCEPTS = {
    "What is a Neuron?": """
A **neuron** is the basic computational unit. It takes inputs, multiplies by weights, sums them up, adds a bias, and applies an activation function.

```
z = w₁x₁ + w₂x₂ + ... + wₙxₙ + b   (linear combination)
a = activation(z)                     (non-linear output)
```

Think of it as a simple function that asks: "How strongly do these inputs activate me?"
""",
    "What is a Layer?": """
A **layer** is a group of neurons that all process the same input.

- **Input layer**: raw data (features)
- **Hidden layers**: intermediate representations — the network "thinks" here
- **Output layer**: final prediction (probability, class, value)

Stacking layers allows the network to learn increasingly abstract features:
- Layer 1: detects simple patterns
- Layer 2: combines those into more complex ones
- Layer N: high-level concepts
""",
    "What are Weights?": """
**Weights** (W) are the learnable parameters. Each connection between neurons has one weight.

Initially set to small random values. During training, the optimizer adjusts them to minimize loss.

A weight close to 0 → that input barely matters.
A large positive weight → that input strongly activates the neuron.
A large negative weight → that input strongly inhibits the neuron.
""",
    "What is Bias?": """
A **bias** (b) shifts the activation threshold.

Without bias: z = w·x — the network can only draw lines through the origin.
With bias: z = w·x + b — the network can shift the decision boundary anywhere.

Biases are learnable too. They start at 0 and get adjusted during training.
""",
    "What is Activation?": """
**Activation functions** introduce non-linearity. Without them, no matter how many layers you stack, the network is just one big linear function.

| Function | Range | Use case |
|----------|-------|----------|
| ReLU | [0, ∞) | Hidden layers (default today) |
| Sigmoid | (0, 1) | Binary output |
| Tanh | (-1, 1) | Hidden layers (older) |
| Softmax | (0, 1) summing to 1 | Multi-class output |

ReLU is popular because it's fast, non-saturating for positive values, and creates sparse activations.
""",
    "What is Loss?": """
A **loss function** measures how wrong the predictions are. It returns a single scalar — the "score of badness."

Training = minimizing this scalar.

| Problem | Loss function | Notes |
|---------|--------------|-------|
| Regression | MSE | Penalizes large errors heavily |
| Binary classification | Binary Cross-Entropy | Punishes confident wrong predictions |
| Multi-class | Categorical Cross-Entropy | Sum of per-class log-penalties |

Cross-entropy is preferred for classification because it creates much stronger gradients when the network is confidently wrong.
""",
    "What is a Gradient?": """
A **gradient** is a vector of partial derivatives telling us how the loss changes with each weight.

```
gradient = dLoss/dWeight
```

If the gradient is **positive** → increasing that weight increases loss → we should decrease it.
If the gradient is **negative** → increasing that weight decreases loss → we should increase it.

We move weights in the *opposite* direction of the gradient (gradient descent).
""",
    "What is Backpropagation?": """
**Backpropagation** is the algorithm to efficiently compute gradients for all weights using the chain rule of calculus.

We start at the output (where we know the loss gradient) and propagate backwards through each layer:

```
dL/dW_L  ← computed directly from output
dL/dW_{L-1} ← chain rule: dL/dA_{L-1} × dA_{L-1}/dZ_{L-1} × dZ_{L-1}/dW_{L-1}
...
dL/dW_1  ← gradients have propagated all the way back
```

The key insight: we only need to store layer outputs (Z, A) during the forward pass to compute all gradients.
""",
    "What is Learning Rate?": """
The **learning rate** (α) controls how large each weight update step is.

```
W = W - α × gradient
```

- **Too large**: steps overshoot the minimum, loss oscillates or diverges
- **Too small**: training is very slow, may get stuck in local minima
- **Adaptive methods** (Adam): automatically scale the learning rate per-parameter

Typical starting values:
- SGD: 0.01 – 0.1
- Adam: 0.001 (almost always works as a starting point)
""",
    "What is Overfitting?": """
**Overfitting** = the model memorizes training data instead of learning general patterns.

**Signs**:
- Training accuracy is high, but validation accuracy is much lower
- Loss gap: train_loss << val_loss

**Causes**:
- Too many parameters relative to data size
- Training too long
- Noisy labels

**Fixes** (not implemented here, but to know):
- Dropout (randomly disable neurons during training)
- L2 regularization (penalize large weights)
- Early stopping (stop when val_loss starts rising)
- More training data
""",
    "Why Do Neural Networks Need Non-Linearity?": """
**Without** non-linear activations, stacking layers is mathematically identical to a single linear transformation:

```
Layer 2 output = (X × W₁ + b₁) × W₂ + b₂
               = X × (W₁W₂) + (b₁W₂ + b₂)
               = X × W_combined + b_combined
```

This can only separate data with a **straight line**. XOR, circles, spirals — impossible.

**With** ReLU/Tanh/Sigmoid, each layer learns a different curved transformation of the input space.

By the **Universal Approximation Theorem** (Cybenko, 1989):
> A neural network with a single hidden layer and a non-linear activation can approximate *any* continuous function to arbitrary accuracy — given enough neurons.
""",
}


def page_concepts():
    st.title("📚 Concepts")
    st.markdown("Select a concept to explore. These are serious explanations, not simplified analogies.")

    selected = st.selectbox("Choose a concept", list(CONCEPTS.keys()))
    st.markdown("---")
    st.markdown(f"## {selected}")
    st.markdown(CONCEPTS[selected])


# ─── Page: Math Notes ─────────────────────────────────────────────────────────

def page_math():
    st.title("🧮 Math Notes")
    st.markdown("The actual equations, derivations, and matrix math behind neural networks.")

    topic_labels = {
        "neuron": "The Neuron Equation",
        "forward_pass": "Forward Pass (all layers)",
        "loss_functions": "Loss Functions & Gradients",
        "backpropagation": "Backpropagation (Chain Rule)",
        "gradient_descent": "Gradient Descent & Optimizers",
        "why_nonlinearity": "Why Non-Linearity is Necessary",
        "overfitting": "Overfitting & Regularization",
    }

    selected = st.selectbox("Select topic", list(topic_labels.values()))
    topic_key = {v: k for k, v in topic_labels.items()}[selected]

    st.markdown("---")
    st.code(NOTES[topic_key], language=None)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    cfg = render_sidebar()
    page = cfg["page"]

    if page == "🧪 Train & Explore":
        page_train(cfg)
    elif page == "🔬 Step-by-Step Mode":
        page_step_by_step(cfg)
    elif page == "📚 Concepts":
        page_concepts()
    elif page == "🧮 Math Notes":
        page_math()


if __name__ == "__main__":
    main()
