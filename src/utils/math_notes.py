"""
Math Notes — annotated derivations of the key equations in neural networks.

This file is a reference, not executable training code.
Read it to understand *why* the formulas work, not just *what* they are.

Run this file to print all derivations to stdout.
"""

import numpy as np


NOTES = {
    "neuron": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT IS A NEURON?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A neuron (also called a unit or node) takes multiple inputs, multiplies
each by a weight, adds a bias, and passes the result through an activation.

Mathematically, for inputs x₁, x₂, ..., xₙ:

  z = w₁x₁ + w₂x₂ + ... + wₙxₙ + b  =  w·x + b    ← linear combination
  a = activation(z)                                   ← non-linear output

Think of it like a biological neuron:
  - Weights = strength of incoming signal
  - Bias = threshold to activate
  - Activation = "does this neuron fire?"

In matrix form for a batch of m samples:
  Z = X @ W + b     (m × output_size)
  A = activation(Z)
""",

    "forward_pass": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORWARD PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For a network with L layers, the forward pass computes:

  A[0] = X                              (input)
  Z[l] = A[l-1] @ W[l] + b[l]          (linear step)
  A[l] = activation_l(Z[l])            (non-linear step)
  ŷ    = A[L]                           (final prediction)

Each layer transforms the representation of the data.
The depth of the network allows it to learn hierarchical features.
""",

    "loss_functions": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOSS FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MSE (Mean Squared Error) — for regression:
  L = (1/n) Σ (ŷᵢ - yᵢ)²
  dL/dŷ = (2/n)(ŷ - y)   ← gradient pushes prediction toward true value

Binary Cross-Entropy — for binary classification:
  L = -(1/n) Σ [yᵢ log(ŷᵢ) + (1-yᵢ) log(1-ŷᵢ)]
  dL/dŷ = -(y/ŷ) + (1-y)/(1-ŷ)   ← very large gradient when very wrong!

Categorical Cross-Entropy — for multi-class:
  L = -(1/n) Σᵢ Σⱼ yᵢⱼ log(ŷᵢⱼ)
  With Softmax output: dL/dZ = (ŷ - y) / n   ← elegant combined gradient

Cross-entropy penalizes confident wrong predictions much more than MSE.
This is why it converges faster for classification tasks.
""",

    "backpropagation": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKPROPAGATION (Chain Rule Applied to Networks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Goal: compute dL/dW[l] and dL/db[l] for every layer l.

We use the chain rule of calculus. Starting from the output layer:

  dL/dA[L] = loss.backward()              ← gradient of loss w.r.t. output
  dL/dZ[l] = dL/dA[l] * activation'(Z[l])  ← through activation (element-wise)
  dL/dW[l] = A[l-1].T @ dL/dZ[l] / m     ← weight gradient
  dL/db[l] = mean(dL/dZ[l], axis=0)       ← bias gradient
  dL/dA[l-1] = dL/dZ[l] @ W[l].T          ← pass gradient to previous layer

This is the mathematical heart of deep learning.
The key insight: we only need to store Z[l] and A[l] during the forward pass
to compute all gradients during the backward pass.

Time complexity: O(forward pass) — backprop costs about the same as forward.
""",

    "gradient_descent": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GRADIENT DESCENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gradient descent minimizes the loss by moving in the direction of steepest decrease:

  W = W - α * dL/dW     (α = learning rate)
  b = b - α * dL/db

The gradient dL/dW tells us the direction of steepest *increase*.
We subtract it to go downhill.

Variants:
  - Full-batch GD: use all data to compute gradient (stable, slow)
  - SGD (batch=1): use one sample at a time (fast but noisy)
  - Mini-batch (batch=32): compromise — fast AND reasonably stable

Learning rate α:
  - Too large: steps overshoot the minimum, loss oscillates
  - Too small: convergence is painfully slow
  - Adaptive methods (Adam) automatically tune per-parameter learning rates
""",

    "why_nonlinearity": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY DO NEURAL NETWORKS NEED NON-LINEARITY?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Without activation functions, stacking layers collapses to one linear layer:

  Layer 1: Z₁ = X @ W₁ + b₁
  Layer 2: Z₂ = Z₁ @ W₂ + b₂ = X @ (W₁W₂) + (b₁W₂ + b₂)
                                = X @ W_combined + b_combined

No matter how many layers you add, the result is always just: Z = X @ W + b
This can only represent linear decision boundaries (a straight line in 2D).

XOR, circles, spirals — none of these can be separated by a line.

Non-linear activations (ReLU, Sigmoid, Tanh) break this collapse.
They allow the network to learn curved, complex decision boundaries.

This is the fundamental theorem of neural networks:
  "A neural network with at least one hidden layer and non-linear activations
   is a universal function approximator." (Cybenko, 1989)
""",

    "overfitting": """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERFITTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overfitting: the model memorizes training data instead of learning general patterns.

Signs:
  - Training loss decreases → good
  - Validation loss increases after a point → overfitting!
  - Large gap between train accuracy and val accuracy

Causes:
  - Too many parameters for the amount of training data
  - Training too long without regularization
  - Noisy training data

Solutions (not implemented here, but important to know):
  - Dropout: randomly zero out neurons during training
  - L2 regularization (weight decay): penalize large weights
  - Early stopping: stop when val loss starts increasing
  - More training data
  - Data augmentation
""",
}


def print_all_notes():
    """Print all mathematical notes to the console."""
    for topic, note in NOTES.items():
        print(note)


def get_note(topic: str) -> str:
    """Return a specific note by topic name."""
    return NOTES.get(topic, f"No note found for topic: {topic}")


def numerical_gradient_check(network, X: np.ndarray, y: np.ndarray, epsilon: float = 1e-5) -> dict:
    """
    Gradient checking — verify analytical gradients are correct by comparing
    to numerical approximation using the finite difference method.

    Numerical gradient: dL/dW ≈ (L(W + ε) - L(W - ε)) / (2ε)

    If the relative error < 1e-5, the backprop is correct.
    This is a standard sanity check for neural network implementations.
    """
    # Forward + backward pass to get analytical gradients
    y_pred = network.forward(X)
    network.loss_fn.forward(y_pred, y)
    network.backward(y_pred, y)

    results = {}

    for layer_idx, layer in enumerate(network.layers):
        W_flat = layer.W.flatten()
        dW_analytical = layer.dW.flatten()
        n_check = min(10, len(W_flat))  # Check first 10 weights to keep it fast

        dW_numerical = np.zeros(n_check)

        W_shape = layer.W.shape
        for i in range(n_check):
            orig = W_flat[i]

            # Forward with W + epsilon
            W_flat[i] = orig + epsilon
            layer.W = W_flat.reshape(W_shape)
            pred_plus = network.forward(X)
            loss_plus = network.loss_fn.forward(pred_plus, y)

            # Forward with W - epsilon
            W_flat[i] = orig - epsilon
            layer.W = W_flat.reshape(W_shape)
            pred_minus = network.forward(X)
            loss_minus = network.loss_fn.forward(pred_minus, y)

            # Restore
            W_flat[i] = orig
            layer.W = W_flat.reshape(W_shape)

            dW_numerical[i] = (loss_plus - loss_minus) / (2 * epsilon)

        # Re-run forward + backward with original weights to get fresh analytical gradients
        y_pred_fresh = network.forward(X)
        network.loss_fn.forward(y_pred_fresh, y)
        network.backward(y_pred_fresh, y)
        dW_analytical = network.layers[layer_idx].dW.flatten()

        analytical = dW_analytical[:n_check]
        relative_error = np.linalg.norm(dW_numerical - analytical) / (
            np.linalg.norm(dW_numerical) + np.linalg.norm(analytical) + 1e-10
        )

        results[f"layer_{layer_idx}"] = {
            "relative_error": float(relative_error),
            "passed": relative_error < 1e-4,
        }

    return results


if __name__ == "__main__":
    print_all_notes()
