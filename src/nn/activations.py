"""
Activation functions — the non-linearities that give neural networks their power.

Without activation functions, stacking layers would be equivalent to a single
linear transformation. Non-linearities let networks learn complex decision boundaries.

Each activation class implements:
  forward(z)  -> output a (stored for reuse in backward pass)
  backward(dA) -> gradient dZ = dA * activation_derivative(z)
"""

import numpy as np


class ReLU:
    """
    Rectified Linear Unit: f(z) = max(0, z)

    Why use it:
    - Simple and fast to compute
    - Does not saturate for positive values (avoids vanishing gradient)
    - Sparse activation: many neurons output 0, making the network efficient

    Downside: "Dying ReLU" — neurons can get stuck at 0 if weights go too negative.
    """

    def __init__(self):
        self.mask = None  # Boolean mask of where z > 0, saved for backward pass

    def forward(self, z: np.ndarray) -> np.ndarray:
        self.mask = z > 0
        return np.where(self.mask, z, 0.0)

    def backward(self, dA: np.ndarray) -> np.ndarray:
        # Derivative of ReLU is 1 where z > 0, else 0
        return dA * self.mask.astype(float)

    def __repr__(self):
        return "ReLU"


class Sigmoid:
    """
    Sigmoid: f(z) = 1 / (1 + exp(-z))

    Output range: (0, 1) — perfect for binary classification output layer.

    Downside: Saturates at extremes (gradient → 0), causing vanishing gradients
    in deep networks. Rarely used in hidden layers today.
    """

    def __init__(self):
        self.output = None  # Saved forward output (used in backward)

    def forward(self, z: np.ndarray) -> np.ndarray:
        # Numerically stable: clip z to avoid exp overflow
        z_clipped = np.clip(z, -500, 500)
        self.output = 1.0 / (1.0 + np.exp(-z_clipped))
        return self.output

    def backward(self, dA: np.ndarray) -> np.ndarray:
        # Derivative of sigmoid: s * (1 - s)
        s = self.output
        return dA * s * (1.0 - s)

    def __repr__(self):
        return "Sigmoid"


class Tanh:
    """
    Hyperbolic Tangent: f(z) = tanh(z) = (exp(z) - exp(-z)) / (exp(z) + exp(-z))

    Output range: (-1, 1) — zero-centered, which helps gradient flow.
    Generally preferred over Sigmoid for hidden layers.

    Still suffers from saturation at extremes.
    """

    def __init__(self):
        self.output = None

    def forward(self, z: np.ndarray) -> np.ndarray:
        self.output = np.tanh(z)
        return self.output

    def backward(self, dA: np.ndarray) -> np.ndarray:
        # Derivative of tanh: 1 - tanh(z)^2
        return dA * (1.0 - self.output**2)

    def __repr__(self):
        return "Tanh"


class Softmax:
    """
    Softmax: f(z_i) = exp(z_i) / sum(exp(z_j))

    Converts a vector of raw scores into a probability distribution.
    Used in the output layer for multi-class classification.

    Note: When combined with Cross-Entropy loss, the backward pass simplifies
    beautifully to (predictions - targets), which is why we handle Softmax+CE
    together in the loss module when needed.
    """

    def __init__(self):
        self.output = None

    def forward(self, z: np.ndarray) -> np.ndarray:
        # Subtract max for numerical stability (prevents exp overflow)
        z_shifted = z - np.max(z, axis=1, keepdims=True)
        exp_z = np.exp(z_shifted)
        self.output = exp_z / np.sum(exp_z, axis=1, keepdims=True)
        return self.output

    def backward(self, dA: np.ndarray) -> np.ndarray:
        # Full Jacobian-based backward. For CE+Softmax combined, use the simpler
        # path in the loss — but this standalone version is mathematically complete.
        batch_size = self.output.shape[0]
        dZ = np.zeros_like(dA)
        for i in range(batch_size):
            s = self.output[i].reshape(-1, 1)  # column vector
            jacobian = np.diagflat(s) - s @ s.T
            dZ[i] = jacobian @ dA[i]
        return dZ

    def __repr__(self):
        return "Softmax"


class Linear:
    """
    Linear (identity) activation: f(z) = z

    Used in regression output layers. No squashing — raw values pass through.
    """

    def forward(self, z: np.ndarray) -> np.ndarray:
        return z

    def backward(self, dA: np.ndarray) -> np.ndarray:
        return dA  # Derivative is 1

    def __repr__(self):
        return "Linear"


# Registry — maps string names to activation classes for easy lookup
ACTIVATIONS = {
    "relu": ReLU,
    "sigmoid": Sigmoid,
    "tanh": Tanh,
    "softmax": Softmax,
    "linear": Linear,
}


def get_activation(name: str):
    """Return an instantiated activation by name (case-insensitive)."""
    key = name.lower()
    if key not in ACTIVATIONS:
        raise ValueError(f"Unknown activation '{name}'. Choose from: {list(ACTIVATIONS)}")
    return ACTIVATIONS[key]()
