"""
Spiral Experiment — arguably the hardest standard benchmark for neural networks.

Three interleaved spirals require the network to learn complex curved decision
boundaries that can't be captured by shallow networks.

What to observe:
  - Shallow networks (1 hidden layer, few neurons) fail to separate spirals
  - Deeper/wider networks succeed, but may overfit with small datasets
  - Training is slower — loss decreases gradually as the network "uncoils" the spirals
  - ReLU works better than Sigmoid/Tanh here
"""

import numpy as np
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from src.nn import NeuralNetwork, Dense, ReLU, Softmax, Adam, Trainer
from src.data.toy_datasets import make_spiral, normalize


def run_spiral_experiment(
    hidden_units: int = 64,
    n_hidden_layers: int = 2,
    learning_rate: float = 0.001,
    epochs: int = 2000,
    verbose: bool = True,
) -> dict:
    """
    Train a deep network on the 3-class spiral problem.
    """
    # --- Data ---
    X, y_onehot = make_spiral(n_samples=300, n_classes=3)
    X_norm, _, _ = normalize(X)

    # --- Architecture: 2 → [hidden × n] → 3 (softmax) ---
    net = NeuralNetwork()
    net.add(Dense(2, hidden_units, activation=ReLU(), init="he", name=f"Hidden1(ReLU,{hidden_units})"))
    for i in range(n_hidden_layers - 1):
        net.add(Dense(hidden_units, hidden_units, activation=ReLU(), init="he",
                      name=f"Hidden{i+2}(ReLU,{hidden_units})"))
    net.add(Dense(hidden_units, 3, activation=Softmax(), init="xavier", name="Output(Softmax,3)"))
    net.compile(loss="categorical_crossentropy", optimizer=Adam(learning_rate))

    if verbose:
        print(net.summary())

    # --- Train ---
    trainer = Trainer(net, batch_size=64, verbose=verbose)
    history = trainer.train(X_norm, y_onehot, epochs=epochs)

    if verbose:
        final_acc = history["accuracy"][-1]
        print(f"\nFinal accuracy on spiral: {final_acc:.4f}")

    return {"history": history, "network": net, "X": X_norm, "y": y_onehot}


if __name__ == "__main__":
    print("=" * 60)
    print("SPIRAL EXPERIMENT")
    print("=" * 60)
    run_spiral_experiment(hidden_units=64, n_hidden_layers=2, epochs=3000)
