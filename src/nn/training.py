"""
Training loop — orchestrates the full training process.

This module provides:
  - train()        : standard epoch-based training loop with batch support
  - train_epoch()  : single epoch, returns metrics
  - Trainer class  : stateful trainer with full history and callbacks

The training loop is where everything comes together:
  1. For each epoch, loop through the data (in batches or full-batch)
  2. Run forward pass → compute loss → run backward pass → update weights
  3. Record metrics for analysis
"""

import numpy as np
from typing import Optional, Callable
from src.nn.network import NeuralNetwork


def create_batches(
    X: np.ndarray, y: np.ndarray, batch_size: int, shuffle: bool = True
):
    """
    Split (X, y) into mini-batches.

    Mini-batch gradient descent is a compromise between:
      - Full-batch GD: stable but slow on large data
      - SGD (batch_size=1): fast but very noisy updates
      - Mini-batch: best of both worlds, typically batch_size=32–256
    """
    n = X.shape[0]
    indices = np.arange(n)
    if shuffle:
        np.random.shuffle(indices)

    for start in range(0, n, batch_size):
        end = min(start + batch_size, n)
        idx = indices[start:end]
        yield X[idx], y[idx]


class Trainer:
    """
    Stateful trainer — wraps NeuralNetwork and manages the training loop.

    Attributes
    ----------
    history : dict with 'loss', 'accuracy', 'val_loss', 'val_accuracy' lists
    """

    def __init__(
        self,
        network: NeuralNetwork,
        batch_size: int = 32,
        verbose: bool = True,
    ):
        self.network = network
        self.batch_size = batch_size
        self.verbose = verbose

        self.history: dict[str, list[float]] = {
            "loss": [],
            "accuracy": [],
            "val_loss": [],
            "val_accuracy": [],
        }

        # Per-epoch weight snapshots (for visualization, sampled to save memory)
        self.weight_snapshots: list[list[dict]] = []
        self.gradient_snapshots: list[list[dict]] = []
        self._snapshot_every: int = 10  # Save snapshot every N epochs

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        epochs: int,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        epoch_callback: Optional[Callable] = None,
    ) -> dict:
        """
        Run the full training loop.

        epoch_callback(epoch, metrics): optional function called after each epoch.
        Useful for streaming metrics to a Streamlit UI.

        Returns the history dict.
        """
        self.history = {"loss": [], "accuracy": [], "val_loss": [], "val_accuracy": []}

        for epoch in range(1, epochs + 1):
            # --- Train one epoch ---
            epoch_loss, epoch_acc = self._train_epoch(X_train, y_train)

            self.history["loss"].append(epoch_loss)
            self.history["accuracy"].append(epoch_acc)

            # --- Validation (optional) ---
            if X_val is not None and y_val is not None:
                val_pred = self.network.predict(X_val)
                val_loss = self.network.loss_fn.forward(val_pred, y_val)
                val_acc = self.network.accuracy(val_pred, y_val)
            else:
                val_loss, val_acc = 0.0, 0.0

            self.history["val_loss"].append(val_loss)
            self.history["val_accuracy"].append(val_acc)

            # --- Snapshots for visualization ---
            if epoch % self._snapshot_every == 0 or epoch == 1:
                self.weight_snapshots.append(self.network.get_weights_snapshot())
                self.gradient_snapshots.append(self.network.get_gradients_snapshot())

            # --- Callback (e.g., update Streamlit progress) ---
            if epoch_callback:
                metrics = {
                    "epoch": epoch,
                    "loss": epoch_loss,
                    "accuracy": epoch_acc,
                    "val_loss": val_loss,
                    "val_accuracy": val_acc,
                }
                epoch_callback(epoch, metrics)

            # --- Verbose logging ---
            if self.verbose and (epoch % max(1, epochs // 10) == 0 or epoch == 1):
                val_str = f"  val_loss={val_loss:.4f}  val_acc={val_acc:.4f}" if X_val is not None else ""
                print(
                    f"Epoch {epoch:4d}/{epochs}  "
                    f"loss={epoch_loss:.4f}  acc={epoch_acc:.4f}"
                    + val_str
                )

        return self.history

    def _train_epoch(
        self, X: np.ndarray, y: np.ndarray
    ) -> tuple[float, float]:
        """
        Train for one epoch over the entire dataset.
        Returns (mean_loss, mean_accuracy) over all batches.
        """
        batch_losses, batch_accs = [], []

        for X_batch, y_batch in create_batches(X, y, self.batch_size):
            loss, acc = self.network.train_step(X_batch, y_batch)
            batch_losses.append(loss)
            batch_accs.append(acc)

        return float(np.mean(batch_losses)), float(np.mean(batch_accs))
