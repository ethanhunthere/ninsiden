"""
XOR Experiment — the classic problem that proved single-layer networks have limits.

Historical context:
  In 1969, Minsky and Papert published "Perceptrons" showing that a single-layer
  network cannot solve XOR. This contributed to the first "AI winter".
  The solution — hidden layers with non-linear activations — was rediscovered
  in the 1980s (backpropagation).

What to observe:
  - A network with no hidden layers fails to converge
  - Adding one hidden layer with 4+ neurons solves XOR perfectly
  - The decision boundary becomes a quadrant-like shape
"""

import numpy as np
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from src.nn import NeuralNetwork, Dense, ReLU, Sigmoid, SGD, Trainer
from src.data.toy_datasets import make_xor, normalize


def run_xor_experiment(
    hidden_units: int = 8,
    learning_rate: float = 0.1,
    epochs: int = 1000,
    verbose: bool = True,
) -> dict:
    """
    Train a 2-layer network on the XOR problem.
    Returns history dict with loss and accuracy.
    """
    # --- Data ---
    X, y = make_xor(n_samples=400, noise=0.1)
    X_norm, _, _ = normalize(X)

    # --- Architecture: 2 → hidden → 1 ---
    net = NeuralNetwork()
    net.add(Dense(2, hidden_units, activation=ReLU(), init="he", name=f"Hidden(ReLU,{hidden_units})"))
    net.add(Dense(hidden_units, 1, activation=Sigmoid(), init="xavier", name="Output(Sigmoid)"))
    net.compile(loss="bce", optimizer=SGD(learning_rate))

    if verbose:
        print(net.summary())

    # --- Train ---
    trainer = Trainer(net, batch_size=32, verbose=verbose)
    history = trainer.train(X_norm, y, epochs=epochs)

    final_acc = history["accuracy"][-1]
    final_loss = history["loss"][-1]

    if verbose:
        print(f"\nFinal accuracy: {final_acc:.4f}")
        print(f"Final loss:     {final_loss:.4f}")

        # Show that it learned XOR correctly
        print("\nXOR truth table check:")
        test_points = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
        test_norm = (test_points - np.mean(X, axis=0)) / (np.std(X, axis=0) + 1e-8)
        preds = net.predict(test_norm)
        for point, pred in zip(test_points, preds):
            expected_xor = int(point[0]) ^ int(point[1])
            print(f"  XOR({int(point[0])}, {int(point[1])}) = {expected_xor} | predicted: {pred[0]:.3f}")

    return {"history": history, "network": net, "X": X_norm, "y": y}


if __name__ == "__main__":
    print("=" * 60)
    print("XOR EXPERIMENT")
    print("=" * 60)
    run_xor_experiment(hidden_units=8, learning_rate=0.1, epochs=2000)
