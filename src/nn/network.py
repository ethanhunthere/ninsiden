"""
NeuralNetwork — assembles Dense layers into a complete feed-forward network.

This is the high-level model class. It:
  1. Chains layers together (forward pass)
  2. Computes loss
  3. Runs backpropagation (backward pass)
  4. Updates weights via optimizer
  5. Stores history for visualization

The network works for binary and multi-class classification, and regression.
"""

import numpy as np
from typing import Optional
from src.nn.layers import Dense
from src.nn.losses import get_loss, MeanSquaredError, BinaryCrossEntropy, CategoricalCrossEntropy
from src.nn.activations import get_activation


class NeuralNetwork:
    """
    A sequential feed-forward neural network built from Dense layers.

    Usage example:
        net = NeuralNetwork()
        net.add(Dense(2, 8, activation=ReLU()))
        net.add(Dense(8, 1, activation=Sigmoid()))
        net.compile(loss='bce', optimizer=SGD(0.1))
        net.fit(X_train, y_train, epochs=100)
    """

    def __init__(self):
        self.layers: list[Dense] = []
        self.loss_fn = None
        self.optimizer = None

        # Training history (for plotting)
        self.history: dict[str, list[float]] = {"loss": [], "accuracy": []}

        # Step-by-step inspection cache (most recent forward/backward pass)
        self.step_cache: list[dict] = []

    def add(self, layer: Dense) -> "NeuralNetwork":
        """Add a layer to the network. Returns self for chaining."""
        self.layers.append(layer)
        return self

    def compile(self, loss: str, optimizer) -> "NeuralNetwork":
        """Set the loss function and optimizer."""
        self.loss_fn = get_loss(loss) if isinstance(loss, str) else loss
        self.optimizer = optimizer
        return self

    # ------------------------------------------------------------------
    # Forward pass
    # ------------------------------------------------------------------
    def forward(self, X: np.ndarray, capture_steps: bool = False) -> np.ndarray:
        """
        Run data through all layers in sequence.

        capture_steps=True: records each layer's Z and A for step-by-step mode.
        """
        if capture_steps:
            self.step_cache = []

        current = X
        for layer in self.layers:
            current = layer.forward(current)
            if capture_steps:
                self.step_cache.append({
                    "layer_name": layer.name,
                    "activation": repr(layer.activation) if layer.activation else "Linear",
                    "Z": layer.Z.copy(),
                    "A": layer.A.copy(),
                    "W": layer.W.copy(),
                    "b": layer.b.copy(),
                })
        return current

    # ------------------------------------------------------------------
    # Backward pass
    # ------------------------------------------------------------------
    def backward(self, y_pred: np.ndarray, y_true: np.ndarray) -> None:
        """
        Backpropagation — compute gradients for all layers.

        Chain rule applied in reverse:
          dL/dW_i = dL/dA_i * dA_i/dZ_i * dZ_i/dW_i

        We start from the loss gradient and propagate backwards.
        """
        # Handle combined Softmax + CE case (cleaner gradient)
        last_layer = self.layers[-1]
        if (
            isinstance(self.loss_fn, CategoricalCrossEntropy)
            and repr(last_layer.activation) == "Softmax"
        ):
            # Combined gradient: (y_pred - y_true) / n
            n = y_pred.shape[0]
            dA = (y_pred - y_true) / n
            # Skip activation backward in last layer (already folded into gradient)
            dZ = dA
            last_layer.dW = last_layer.X_input.T @ dZ
            last_layer.db = np.sum(dZ, axis=0, keepdims=True)
            upstream = dZ @ last_layer.W.T
            # Continue backward through remaining layers
            for layer in reversed(self.layers[:-1]):
                upstream = layer.backward(upstream)
        else:
            # Standard path
            dA = self.loss_fn.backward()
            for layer in reversed(self.layers):
                dA = layer.backward(dA)

    # ------------------------------------------------------------------
    # Weight update
    # ------------------------------------------------------------------
    def update_weights(self) -> None:
        """Apply optimizer to all layer parameters."""
        for layer in self.layers:
            self.optimizer.update(layer)

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------
    def train_step(
        self, X: np.ndarray, y: np.ndarray
    ) -> tuple[float, float]:
        """
        One full forward + backward + update pass.
        Returns (loss, accuracy).
        """
        y_pred = self.forward(X)
        loss = self.loss_fn.forward(y_pred, y)
        self.backward(y_pred, y)
        self.update_weights()
        acc = self.accuracy(y_pred, y)
        return loss, acc

    # ------------------------------------------------------------------
    # Prediction and accuracy
    # ------------------------------------------------------------------
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Run forward pass without storing gradients."""
        return self.forward(X)

    def predict_classes(self, X: np.ndarray) -> np.ndarray:
        """Return class index predictions."""
        probs = self.predict(X)
        if probs.shape[1] == 1:
            # Binary
            return (probs >= 0.5).astype(int).flatten()
        else:
            # Multi-class
            return np.argmax(probs, axis=1)

    def accuracy(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """
        Accuracy: fraction of correct predictions.

        For binary: threshold at 0.5.
        For multi-class: argmax.
        """
        if y_pred.shape[1] == 1:
            # Binary classification
            predicted = (y_pred >= 0.5).astype(int).flatten()
            true = y_true.flatten().astype(int)
        else:
            # Multi-class
            predicted = np.argmax(y_pred, axis=1)
            true = np.argmax(y_true, axis=1) if y_true.ndim > 1 else y_true.flatten().astype(int)

        return float(np.mean(predicted == true))

    # ------------------------------------------------------------------
    # Inspection helpers
    # ------------------------------------------------------------------
    def get_weights_snapshot(self) -> list[dict]:
        """Return current weights/biases for all layers."""
        return [
            {
                "layer": i,
                "name": layer.name,
                "W": layer.W.copy(),
                "b": layer.b.copy(),
                "W_mean": float(np.mean(layer.W)),
                "W_std": float(np.std(layer.W)),
                "b_mean": float(np.mean(layer.b)),
            }
            for i, layer in enumerate(self.layers)
        ]

    def get_gradients_snapshot(self) -> list[dict]:
        """Return current gradients for all layers (call after backward)."""
        snapshots = []
        for i, layer in enumerate(self.layers):
            if layer.dW is not None:
                snapshots.append({
                    "layer": i,
                    "name": layer.name,
                    "dW": layer.dW.copy(),
                    "db": layer.db.copy(),
                    "dW_norm": float(np.linalg.norm(layer.dW)),
                    "db_norm": float(np.linalg.norm(layer.db)),
                })
        return snapshots

    def summary(self) -> str:
        """Print a human-readable summary of the network architecture."""
        lines = ["=" * 60, "Neural Network Architecture", "=" * 60]
        total_params = 0
        for i, layer in enumerate(self.layers):
            params = layer.W.size + layer.b.size
            total_params += params
            lines.append(
                f"Layer {i+1}: {layer.name}"
                f"  |  params: {params}"
                f"  |  act: {repr(layer.activation) if layer.activation else 'Linear'}"
            )
        lines += ["-" * 60, f"Total trainable parameters: {total_params}", "=" * 60]
        return "\n".join(lines)

    def __repr__(self):
        layer_str = " → ".join(repr(l) for l in self.layers)
        return f"NeuralNetwork([{layer_str}])"
