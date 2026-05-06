"""
Loss functions — measure how wrong the network's predictions are.

A loss function takes (predictions, true_labels) and returns a scalar.
Lower loss = better predictions.

The gradient of the loss (dL/dA_output) is the starting point of backpropagation.

We implement:
  - Mean Squared Error (MSE)     — for regression
  - Binary Cross-Entropy (BCE)   — for binary classification
  - Categorical Cross-Entropy    — for multi-class classification
"""

import numpy as np


class MeanSquaredError:
    """
    MSE = mean((y_pred - y_true)^2)

    Classic regression loss. Penalizes large errors more (squared).
    Gradient: dL/d(y_pred) = 2 * (y_pred - y_true) / n
    We drop the 2 (absorbed into learning rate) → (y_pred - y_true) / n
    """

    def forward(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        self.y_pred = y_pred
        self.y_true = y_true
        return float(np.mean((y_pred - y_true) ** 2))

    def backward(self) -> np.ndarray:
        n = self.y_pred.shape[0]
        return (self.y_pred - self.y_true) / n

    def __repr__(self):
        return "MSE"


class BinaryCrossEntropy:
    """
    Binary Cross-Entropy: L = -mean(y * log(p) + (1-y) * log(1-p))

    Used for binary classification (output: sigmoid neuron, values in [0,1]).
    Gradient: (p - y) / (p * (1-p) * n), which simplifies to (p - y)/n
    when combined with sigmoid output.

    We use the combined form here, but store the raw gradient for generality.
    """

    def __init__(self, eps: float = 1e-12):
        self.eps = eps  # Small value to prevent log(0)

    def forward(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        self.y_pred = y_pred
        self.y_true = y_true
        # Clip predictions to avoid log(0) or log(1) numerical issues
        p = np.clip(y_pred, self.eps, 1.0 - self.eps)
        loss = -np.mean(y_true * np.log(p) + (1 - y_true) * np.log(1 - p))
        return float(loss)

    def backward(self) -> np.ndarray:
        p = np.clip(self.y_pred, self.eps, 1.0 - self.eps)
        n = p.shape[0]
        # dL/dp = -(y/p - (1-y)/(1-p)) / n
        return (-(self.y_true / p) + (1 - self.y_true) / (1 - p)) / n

    def __repr__(self):
        return "BinaryCrossEntropy"


class CategoricalCrossEntropy:
    """
    Categorical Cross-Entropy: L = -mean(sum(y_true * log(y_pred)))

    Used for multi-class classification (output: softmax layer).
    y_true should be one-hot encoded: shape (batch, num_classes).

    When paired with Softmax output, the combined gradient is simply:
      dL/dZ = (y_pred - y_true) / n

    This is one of the most elegant results in deep learning.
    """

    def __init__(self, eps: float = 1e-12):
        self.eps = eps

    def forward(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        self.y_pred = y_pred
        self.y_true = y_true
        p = np.clip(y_pred, self.eps, 1.0)
        # Sum over classes, average over batch
        loss = -np.mean(np.sum(y_true * np.log(p), axis=1))
        return float(loss)

    def backward(self) -> np.ndarray:
        """
        Combined Softmax + Cross-Entropy gradient.
        This is valid when the last layer uses Softmax.
        The beautiful result: gradient = (predictions - targets) / n
        """
        n = self.y_pred.shape[0]
        return (self.y_pred - self.y_true) / n

    def __repr__(self):
        return "CategoricalCrossEntropy"


# Registry
LOSSES = {
    "mse": MeanSquaredError,
    "bce": BinaryCrossEntropy,
    "crossentropy": CategoricalCrossEntropy,
    "categorical_crossentropy": CategoricalCrossEntropy,
}


def get_loss(name: str):
    """Return an instantiated loss function by name."""
    key = name.lower()
    if key not in LOSSES:
        raise ValueError(f"Unknown loss '{name}'. Choose from: {list(LOSSES)}")
    return LOSSES[key]()
