"""
Visualization — all plotting functions for the Neural Network Lab.

Built with Plotly for interactive web charts (works great in Streamlit)
and Matplotlib for static plots used in notebooks/experiments.

Key plots:
  - Loss and accuracy curves
  - Decision boundary (the most insightful visualization for 2D classification)
  - Weight histograms
  - Gradient norms over time
  - Step-by-step forward pass diagrams
"""

import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from typing import Optional


# ─── Color scheme ────────────────────────────────────────────────────────────
COLORS = px.colors.qualitative.Set2
LOSS_COLOR = "#e74c3c"
ACC_COLOR = "#2ecc71"
GRAD_COLOR = "#3498db"


# ─── Training curves ─────────────────────────────────────────────────────────

def plot_training_curves(
    history: dict,
    title: str = "Training Progress",
) -> go.Figure:
    """
    Plot loss and accuracy over epochs on a dual-axis chart.

    Shows both training and validation metrics if available.
    """
    epochs = list(range(1, len(history["loss"]) + 1))

    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=("Loss over Epochs", "Accuracy over Epochs"),
    )

    # Loss
    fig.add_trace(
        go.Scatter(x=epochs, y=history["loss"], name="Train Loss",
                   line=dict(color=LOSS_COLOR, width=2)),
        row=1, col=1,
    )
    if history.get("val_loss") and any(v > 0 for v in history["val_loss"]):
        fig.add_trace(
            go.Scatter(x=epochs, y=history["val_loss"], name="Val Loss",
                       line=dict(color=LOSS_COLOR, width=2, dash="dash")),
            row=1, col=1,
        )

    # Accuracy
    fig.add_trace(
        go.Scatter(x=epochs, y=history["accuracy"], name="Train Accuracy",
                   line=dict(color=ACC_COLOR, width=2)),
        row=1, col=2,
    )
    if history.get("val_accuracy") and any(v > 0 for v in history["val_accuracy"]):
        fig.add_trace(
            go.Scatter(x=epochs, y=history["val_accuracy"], name="Val Accuracy",
                       line=dict(color=ACC_COLOR, width=2, dash="dash")),
            row=1, col=2,
        )

    fig.update_layout(
        title=title,
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template="plotly_dark",
    )
    fig.update_yaxes(title_text="Loss", row=1, col=1)
    fig.update_yaxes(title_text="Accuracy", range=[0, 1.05], row=1, col=2)
    fig.update_xaxes(title_text="Epoch")

    return fig


# ─── Decision boundary ────────────────────────────────────────────────────────

def plot_decision_boundary(
    network,
    X: np.ndarray,
    y: np.ndarray,
    title: str = "Decision Boundary",
    resolution: int = 200,
) -> go.Figure:
    """
    Visualize the decision boundary learned by the network.

    Works by creating a dense mesh grid over the feature space and
    running the network on every grid point to get class probabilities.

    This is the most insightful visualization — it shows exactly what the
    network has learned about the data geometry.
    """
    # Build mesh grid
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5

    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, resolution),
        np.linspace(y_min, y_max, resolution),
    )
    grid = np.c_[xx.ravel(), yy.ravel()]

    # Get predictions for each grid point
    probs = network.predict(grid)
    if probs.shape[1] == 1:
        # Binary classification — probability of class 1
        Z = probs.reshape(xx.shape)
        colorscale = "RdBu"
    else:
        # Multi-class — predicted class index
        Z = np.argmax(probs, axis=1).reshape(xx.shape).astype(float)
        colorscale = "Viridis"

    fig = go.Figure()

    # Background shading (decision regions)
    fig.add_trace(go.Contour(
        x=np.linspace(x_min, x_max, resolution),
        y=np.linspace(y_min, y_max, resolution),
        z=Z,
        colorscale=colorscale,
        opacity=0.4,
        showscale=False,
        contours=dict(coloring="fill"),
    ))

    # Data points
    if y.ndim > 1 and y.shape[1] > 1:
        class_labels = np.argmax(y, axis=1)
    else:
        class_labels = y.flatten().astype(int)

    for cls in np.unique(class_labels):
        mask = class_labels == cls
        fig.add_trace(go.Scatter(
            x=X[mask, 0],
            y=X[mask, 1],
            mode="markers",
            name=f"Class {cls}",
            marker=dict(size=6, color=COLORS[cls % len(COLORS)], line=dict(width=0.5, color="white")),
        ))

    fig.update_layout(
        title=title,
        height=420,
        template="plotly_dark",
        xaxis_title="Feature 1",
        yaxis_title="Feature 2",
    )
    return fig


# ─── Weight histograms ───────────────────────────────────────────────────────

def plot_weight_distributions(
    network,
    title: str = "Weight Distributions",
) -> go.Figure:
    """
    Show histograms of weight values for each layer.

    Healthy weights should be roughly zero-centered with moderate spread.
    Watch for:
      - Very large weights → exploding gradients
      - All weights near zero → vanishing gradients / dead network
    """
    n_layers = len(network.layers)
    fig = make_subplots(rows=1, cols=n_layers, subplot_titles=[l.name for l in network.layers])

    for i, layer in enumerate(network.layers):
        weights_flat = layer.W.flatten()
        fig.add_trace(
            go.Histogram(
                x=weights_flat,
                name=layer.name,
                nbinsx=30,
                marker_color=COLORS[i % len(COLORS)],
                opacity=0.75,
            ),
            row=1, col=i + 1,
        )

    fig.update_layout(
        title=title,
        showlegend=False,
        height=300,
        template="plotly_dark",
    )
    return fig


# ─── Gradient norms ───────────────────────────────────────────────────────────

def plot_gradient_norms(
    gradient_snapshots: list[list[dict]],
    title: str = "Gradient Norms over Training",
) -> go.Figure:
    """
    Track the L2 norm of weight gradients for each layer over time.

    Vanishing gradients: norms decrease toward zero (early layers stop learning).
    Exploding gradients: norms grow very large (training destabilizes).
    """
    fig = go.Figure()

    if not gradient_snapshots:
        return fig

    n_layers = len(gradient_snapshots[0]) if gradient_snapshots else 0
    x_axis = list(range(len(gradient_snapshots)))

    for layer_idx in range(n_layers):
        norms = []
        for snapshot in gradient_snapshots:
            if layer_idx < len(snapshot):
                norms.append(snapshot[layer_idx]["dW_norm"])
            else:
                norms.append(0.0)

        layer_name = gradient_snapshots[0][layer_idx]["name"] if gradient_snapshots else f"Layer {layer_idx}"
        fig.add_trace(go.Scatter(
            x=x_axis,
            y=norms,
            mode="lines+markers",
            name=layer_name,
            line=dict(width=2),
        ))

    fig.update_layout(
        title=title,
        xaxis_title="Snapshot Index",
        yaxis_title="||dW|| (L2 Norm)",
        height=300,
        template="plotly_dark",
    )
    return fig


# ─── Step-by-step pass visualization ─────────────────────────────────────────

def plot_layer_activations(
    step_cache: list[dict],
    sample_idx: int = 0,
    title: str = "Layer Activations (Single Sample)",
) -> go.Figure:
    """
    Show activation values at each layer for a single input sample.
    Helps trace information flow through the network.
    """
    n_layers = len(step_cache)
    fig = make_subplots(
        rows=1, cols=n_layers,
        subplot_titles=[f"Layer {i+1}: {c['layer_name']}" for i, c in enumerate(step_cache)],
    )

    for i, cache in enumerate(step_cache):
        A = cache["A"]
        # Take first sample if batch
        if A.ndim > 1:
            activations = A[sample_idx]
        else:
            activations = A

        neuron_indices = list(range(len(activations)))
        fig.add_trace(
            go.Bar(
                x=neuron_indices,
                y=activations,
                name=f"Layer {i+1}",
                marker_color=COLORS[i % len(COLORS)],
            ),
            row=1, col=i + 1,
        )

    fig.update_layout(
        title=title,
        showlegend=False,
        height=300,
        template="plotly_dark",
    )
    return fig


# ─── Network weight heatmap ───────────────────────────────────────────────────

def plot_weight_heatmap(layer, title: str = "") -> go.Figure:
    """
    Heatmap of weight matrix for a single layer.
    Rows = input neurons, Columns = output neurons.
    """
    fig = go.Figure(go.Heatmap(
        z=layer.W,
        colorscale="RdBu",
        zmid=0,
        colorbar=dict(title="Weight value"),
    ))
    fig.update_layout(
        title=title or f"Weight Matrix: {layer.name}",
        xaxis_title="Output neurons",
        yaxis_title="Input neurons",
        height=300,
        template="plotly_dark",
    )
    return fig
