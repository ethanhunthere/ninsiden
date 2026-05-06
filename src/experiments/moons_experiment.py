"""
Moons Experiment — two interleaved half-moons.

A classic medium-difficulty dataset. A single hidden layer is often enough,
but the network needs non-linearity.

What to observe:
  - With Sigmoid: sometimes struggles to find the curved boundary
  - With ReLU: converges faster, cleaner boundary
  - Overfitting: with too many neurons and epochs, the network
    memorizes training data. Add a validation set to detect this.
"""

import numpy as np
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from src.nn import NeuralNetwork, Dense, ReLU, Sigmoid, Adam, Trainer
from src.data.toy_datasets import make_moons, normalize, train_test_split


def run_moons_experiment(
    hidden_units: int = 16,
    learning_rate: float = 0.001,
    epochs: int = 500,
    verbose: bool = True,
) -> dict:
    """
    Train on the two-moons dataset with train/validation split.
    """
    # --- Data ---
    X, y = make_moons(n_samples=400, noise=0.15)
    X_norm, mean, std = normalize(X)
    X_train, X_val, y_train, y_val = train_test_split(X_norm, y, test_size=0.2)

    # --- Architecture ---
    net = NeuralNetwork()
    net.add(Dense(2, hidden_units, activation=ReLU(), init="he", name=f"Hidden(ReLU,{hidden_units})"))
    net.add(Dense(hidden_units, hidden_units // 2, activation=ReLU(), init="he",
                  name=f"Hidden2(ReLU,{hidden_units // 2})"))
    net.add(Dense(hidden_units // 2, 1, activation=Sigmoid(), init="xavier", name="Output(Sigmoid)"))
    net.compile(loss="bce", optimizer=Adam(learning_rate))

    if verbose:
        print(net.summary())

    # --- Train with validation ---
    trainer = Trainer(net, batch_size=32, verbose=verbose)
    history = trainer.train(X_train, y_train, epochs=epochs, X_val=X_val, y_val=y_val)

    if verbose:
        print(f"\nFinal train accuracy: {history['accuracy'][-1]:.4f}")
        print(f"Final val accuracy:   {history['val_accuracy'][-1]:.4f}")

        # Check if overfitting occurred
        gap = history["accuracy"][-1] - history["val_accuracy"][-1]
        if gap > 0.05:
            print(f"\nWarning: Train-val gap of {gap:.3f} suggests overfitting.")

    return {
        "history": history,
        "network": net,
        "X_train": X_train,
        "X_val": X_val,
        "y_train": y_train,
        "y_val": y_val,
    }


if __name__ == "__main__":
    print("=" * 60)
    print("MOONS EXPERIMENT")
    print("=" * 60)
    run_moons_experiment(hidden_units=16, epochs=1000)
