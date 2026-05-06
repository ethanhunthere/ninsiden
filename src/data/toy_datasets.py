"""
Toy datasets for exploring classification and regression problems.

These small, synthetic datasets are perfect for understanding neural networks:
  - You can visualize them in 2D
  - You know the ground truth decision boundary
  - Training is fast so you can experiment interactively

All datasets return (X, y) as numpy arrays.
X shape: (n_samples, 2)   — 2D so we can plot it
y shape: (n_samples, 1) for binary  OR  (n_samples, n_classes) one-hot for multi-class
"""

import numpy as np
from typing import Optional


def make_xor(n_samples: int = 200, noise: float = 0.1, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    XOR dataset — the classic problem that proved shallow networks have limits.

    Points near (0,0) and (1,1) → class 0
    Points near (1,0) and (0,1) → class 1

    Not linearly separable! Requires at least one hidden layer.
    This is historically important: the XOR problem caused the first "AI winter"
    because early perceptrons couldn't solve it.
    """
    rng = np.random.default_rng(seed)
    X = rng.integers(0, 2, size=(n_samples, 2)).astype(float)
    y_raw = np.logical_xor(X[:, 0] > 0.5, X[:, 1] > 0.5).astype(float)

    # Add Gaussian noise to make it more realistic
    X = X + rng.normal(0, noise, X.shape)

    return X, y_raw.reshape(-1, 1)


def make_circles(n_samples: int = 300, noise: float = 0.1, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Two concentric circles — inner circle is class 1, outer circle is class 0.

    Not linearly separable. Neural networks learn a circular decision boundary.
    Great for seeing how depth and non-linearity help.
    """
    from sklearn.datasets import make_circles as sk_circles
    X, y = sk_circles(n_samples=n_samples, noise=noise, factor=0.4, random_state=seed)
    return X.astype(float), y.reshape(-1, 1).astype(float)


def make_moons(n_samples: int = 300, noise: float = 0.15, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Two interleaved half-moons — a popular benchmark for non-linear classifiers.

    Not linearly separable. Decision boundary curves between the moons.
    """
    from sklearn.datasets import make_moons as sk_moons
    X, y = sk_moons(n_samples=n_samples, noise=noise, random_state=seed)
    return X.astype(float), y.reshape(-1, 1).astype(float)


def make_spiral(n_samples: int = 300, n_classes: int = 3, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Spiral dataset — one of the hardest problems for linear classifiers.

    Multiple interleaved spirals. Requires deep non-linear representations.
    Returns one-hot encoded labels for multi-class.
    """
    rng = np.random.default_rng(seed)
    n_per_class = n_samples // n_classes
    X_list, y_list = [], []

    for c in range(n_classes):
        t = np.linspace(0, 1, n_per_class)
        angle = t * 3.5 * 2 * np.pi + (2 * np.pi * c / n_classes)
        r = t
        x1 = r * np.cos(angle) + rng.normal(0, 0.1, n_per_class)
        x2 = r * np.sin(angle) + rng.normal(0, 0.1, n_per_class)
        X_list.append(np.column_stack([x1, x2]))
        y_list.append(np.full(n_per_class, c))

    X = np.vstack(X_list)
    y_int = np.hstack(y_list).astype(int)

    # One-hot encode
    y_onehot = np.zeros((len(y_int), n_classes))
    y_onehot[np.arange(len(y_int)), y_int] = 1.0

    return X.astype(float), y_onehot


def make_linear(n_samples: int = 200, noise: float = 0.1, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Linearly separable data — separated by a line through the origin.

    A single neuron (no hidden layers) can solve this.
    Useful to contrast with non-linearly separable datasets.
    """
    rng = np.random.default_rng(seed)
    X = rng.uniform(-2, 2, (n_samples, 2))
    y_raw = (X[:, 0] + X[:, 1] + rng.normal(0, noise, n_samples) > 0).astype(float)
    return X, y_raw.reshape(-1, 1)


def make_gaussian_blobs(
    n_samples: int = 300,
    n_classes: int = 3,
    cluster_std: float = 0.5,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Gaussian blobs — clearly separated clusters.

    Multi-class classification with well-defined regions.
    Used to demonstrate softmax output layers.
    """
    from sklearn.datasets import make_blobs
    X, y_int = make_blobs(
        n_samples=n_samples,
        n_features=2,
        centers=n_classes,
        cluster_std=cluster_std,
        random_state=seed,
    )
    y_onehot = np.zeros((len(y_int), n_classes))
    y_onehot[np.arange(len(y_int)), y_int] = 1.0
    return X.astype(float), y_onehot


# Registry for the Streamlit app
DATASETS = {
    "XOR": make_xor,
    "Circles": make_circles,
    "Moons": make_moons,
    "Spiral (3-class)": make_spiral,
    "Linear": make_linear,
    "Gaussian Blobs": make_gaussian_blobs,
}


def normalize(X: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Z-score normalize features: (X - mean) / std

    Normalization is critical:
    - Un-normalized features can cause one dimension to dominate gradient updates
    - Helps the optimizer converge faster and more stably

    Returns (X_normalized, mean, std) so you can apply the same transform to test data.
    """
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0) + 1e-8  # epsilon to prevent division by zero
    return (X - mean) / std, mean, std


def train_test_split(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = 0.2,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Simple train/test split without sklearn dependency."""
    rng = np.random.default_rng(seed)
    n = X.shape[0]
    indices = rng.permutation(n)
    split = int(n * (1 - test_size))
    train_idx, test_idx = indices[:split], indices[split:]
    return X[train_idx], X[test_idx], y[train_idx], y[test_idx]
