"""
Dense (fully-connected) layer — the fundamental building block of a neural network.

A Dense layer performs: z = X @ W + b
Then an activation is applied: a = activation(z)

During backpropagation, it computes gradients with respect to:
  - dW: how to adjust weights
  - db: how to adjust biases
  - dX: gradient passed back to the previous layer

Weight initialization matters a lot. We support:
  - He (Kaiming): best with ReLU — scales by sqrt(2/fan_in)
  - Xavier (Glorot): best with Sigmoid/Tanh — scales by sqrt(1/fan_in)
  - Random small: simple baseline
"""

import numpy as np
from typing import Optional


class Dense:
    """
    A fully-connected layer: every input neuron connects to every output neuron.

    Parameters
    ----------
    input_size  : number of features coming in (fan-in)
    output_size : number of neurons in this layer (fan-out)
    activation  : an activation object (ReLU, Sigmoid, etc.) or None for linear
    init        : weight init strategy — 'he', 'xavier', or 'random'
    name        : optional human-readable label (useful for debugging)
    """

    def __init__(
        self,
        input_size: int,
        output_size: int,
        activation=None,
        init: str = "he",
        name: str = "",
    ):
        self.input_size = input_size
        self.output_size = output_size
        self.activation = activation
        self.name = name or f"Dense({input_size}→{output_size})"

        # Initialize weights and biases
        self.W, self.b = self._init_weights(input_size, output_size, init)

        # Cache for backward pass
        self.X_input: Optional[np.ndarray] = None  # Input to this layer
        self.Z: Optional[np.ndarray] = None         # Pre-activation (z = XW + b)
        self.A: Optional[np.ndarray] = None         # Post-activation output

        # Gradients (set during backward pass)
        self.dW: Optional[np.ndarray] = None
        self.db: Optional[np.ndarray] = None

        # Gradient history for visualization
        self.grad_history: list[dict] = []

    def _init_weights(self, fan_in: int, fan_out: int, method: str):
        """
        Weight initialization — critical for stable training.

        Too large → exploding gradients (loss blows up).
        Too small → vanishing gradients (network doesn't learn).
        """
        rng = np.random.default_rng(42)

        if method == "he":
            # He initialization: variance = 2/fan_in
            # Best for ReLU — accounts for the fact that ~half of neurons are off
            scale = np.sqrt(2.0 / fan_in)
        elif method == "xavier":
            # Xavier/Glorot: variance = 1/fan_in  (or 2/(fan_in+fan_out))
            # Best for Sigmoid/Tanh
            scale = np.sqrt(1.0 / fan_in)
        else:
            # Small random — simple but works for demos
            scale = 0.01

        W = rng.normal(0, scale, (fan_in, fan_out))
        b = np.zeros((1, fan_out))  # Biases start at zero
        return W, b

    def forward(self, X: np.ndarray) -> np.ndarray:
        """
        Forward pass:
          z = X @ W + b   (linear combination)
          a = activation(z)  (non-linearity)

        X shape: (batch_size, input_size)
        Output shape: (batch_size, output_size)
        """
        self.X_input = X
        self.Z = X @ self.W + self.b  # (batch, out)

        if self.activation is not None:
            self.A = self.activation.forward(self.Z)
        else:
            self.A = self.Z

        return self.A

    def backward(self, dA: np.ndarray) -> np.ndarray:
        """
        Backward pass — compute gradients using the chain rule.

        Given dA = d(Loss)/d(A), compute:
          dZ = dA * activation'(Z)           [element-wise]
          dW = X.T @ dZ / batch_size         [weight gradient]
          db = mean(dZ, axis=0)              [bias gradient]
          dX = dZ @ W.T                      [gradient for previous layer]

        We average over the batch (divide by batch_size) to keep gradients
        independent of batch size.
        """
        batch_size = dA.shape[0]

        # Step 1: gradient through activation
        if self.activation is not None:
            dZ = self.activation.backward(dA)  # (batch, out)
        else:
            dZ = dA

        # Step 2: gradients w.r.t. weights and biases
        # We do NOT divide by batch_size here — the loss backward already returns
        # a gradient averaged over the batch (i.e. dL/d(mean)), so we just accumulate.
        self.dW = self.X_input.T @ dZ          # (in, out)
        self.db = np.sum(dZ, axis=0, keepdims=True)  # (1, out)

        # Step 3: gradient to pass back to the previous layer
        dX = dZ @ self.W.T  # (batch, in)

        # Store for visualization
        self.grad_history.append({
            "dW_norm": float(np.linalg.norm(self.dW)),
            "db_norm": float(np.linalg.norm(self.db)),
            "dX_norm": float(np.linalg.norm(dX)),
        })

        return dX

    def get_params(self) -> dict:
        """Return current weights and biases as a dict (for visualization)."""
        return {
            "W": self.W.copy(),
            "b": self.b.copy(),
            "W_shape": self.W.shape,
            "b_shape": self.b.shape,
        }

    def __repr__(self):
        act_name = repr(self.activation) if self.activation else "Linear"
        return f"Dense({self.input_size} → {self.output_size}, act={act_name})"
