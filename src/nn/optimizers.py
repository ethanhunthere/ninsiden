"""
Optimizers — algorithms that update weights to minimize the loss.

The key insight: gradients tell us the direction of steepest increase.
We move in the opposite direction (gradient descent).

Implemented:
  - SGD (Stochastic Gradient Descent) — the simplest optimizer
  - SGD with Momentum              — smooths out updates with velocity
  - Adam                           — adaptive learning rates per parameter
"""

import numpy as np
from typing import Optional


class SGD:
    """
    Vanilla Gradient Descent:
      W = W - learning_rate * dW
      b = b - learning_rate * db

    Simple and interpretable, but can be slow and noisy.

    The learning rate controls step size:
      - Too large: overshoots, loss oscillates or diverges
      - Too small: learns very slowly
    """

    def __init__(self, learning_rate: float = 0.01):
        self.lr = learning_rate

    def update(self, layer) -> None:
        """Apply gradient update to a layer's weights and biases."""
        if layer.dW is None:
            return
        layer.W -= self.lr * layer.dW
        layer.b -= self.lr * layer.db

    def __repr__(self):
        return f"SGD(lr={self.lr})"


class SGDMomentum:
    """
    SGD with Momentum:
      velocity = momentum * velocity - lr * gradient
      W = W + velocity

    Momentum accumulates gradient direction over time, like a ball rolling
    downhill. This helps escape shallow local minima and speeds up learning
    in consistent gradient directions.

    Typical momentum value: 0.9 (90% of previous velocity + 10% new gradient).
    """

    def __init__(self, learning_rate: float = 0.01, momentum: float = 0.9):
        self.lr = learning_rate
        self.momentum = momentum
        self._velocities: dict = {}  # Per-layer velocity storage

    def update(self, layer) -> None:
        if layer.dW is None:
            return

        layer_id = id(layer)
        if layer_id not in self._velocities:
            self._velocities[layer_id] = {
                "vW": np.zeros_like(layer.W),
                "vb": np.zeros_like(layer.b),
            }

        v = self._velocities[layer_id]
        # Velocity update (Nesterov-style can be derived from this)
        v["vW"] = self.momentum * v["vW"] - self.lr * layer.dW
        v["vb"] = self.momentum * v["vb"] - self.lr * layer.db

        layer.W += v["vW"]
        layer.b += v["vb"]

    def __repr__(self):
        return f"SGDMomentum(lr={self.lr}, momentum={self.momentum})"


class Adam:
    """
    Adam (Adaptive Moment Estimation):
      Combines momentum (1st moment) and RMSProp (2nd moment).

      m = β1 * m + (1-β1) * g          ← mean of gradients
      v = β2 * v + (1-β2) * g²         ← variance of gradients
      m̂ = m / (1 - β1^t)               ← bias correction
      v̂ = v / (1 - β2^t)
      W = W - lr * m̂ / (sqrt(v̂) + ε)

    Why it works well:
    - Parameters that rarely receive large gradients get bigger steps
    - Parameters with large, noisy gradients get smaller steps
    - Generally robust to learning rate choice

    Typical defaults: β1=0.9, β2=0.999, ε=1e-8
    """

    def __init__(
        self,
        learning_rate: float = 0.001,
        beta1: float = 0.9,
        beta2: float = 0.999,
        epsilon: float = 1e-8,
    ):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self._state: dict = {}
        self.t = 0  # Time step (incremented each update call)

    def update(self, layer) -> None:
        if layer.dW is None:
            return

        self.t += 1
        layer_id = id(layer)

        if layer_id not in self._state:
            self._state[layer_id] = {
                "mW": np.zeros_like(layer.W),
                "vW": np.zeros_like(layer.W),
                "mb": np.zeros_like(layer.b),
                "vb": np.zeros_like(layer.b),
            }

        s = self._state[layer_id]

        # Update biased first and second moment estimates
        s["mW"] = self.beta1 * s["mW"] + (1 - self.beta1) * layer.dW
        s["vW"] = self.beta2 * s["vW"] + (1 - self.beta2) * layer.dW**2
        s["mb"] = self.beta1 * s["mb"] + (1 - self.beta1) * layer.db
        s["vb"] = self.beta2 * s["vb"] + (1 - self.beta2) * layer.db**2

        # Bias correction
        mW_hat = s["mW"] / (1 - self.beta1**self.t)
        vW_hat = s["vW"] / (1 - self.beta2**self.t)
        mb_hat = s["mb"] / (1 - self.beta1**self.t)
        vb_hat = s["vb"] / (1 - self.beta2**self.t)

        # Parameter update
        layer.W -= self.lr * mW_hat / (np.sqrt(vW_hat) + self.epsilon)
        layer.b -= self.lr * mb_hat / (np.sqrt(vb_hat) + self.epsilon)

    def __repr__(self):
        return f"Adam(lr={self.lr})"


OPTIMIZERS = {
    "sgd": SGD,
    "momentum": SGDMomentum,
    "adam": Adam,
}


def get_optimizer(name: str, **kwargs):
    """Return an instantiated optimizer by name."""
    key = name.lower()
    if key not in OPTIMIZERS:
        raise ValueError(f"Unknown optimizer '{name}'. Choose from: {list(OPTIMIZERS)}")
    return OPTIMIZERS[key](**kwargs)
