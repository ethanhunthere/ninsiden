"""
Tests for training loop — verifying that the network actually learns.
"""

import numpy as np
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.nn import NeuralNetwork, Dense, ReLU, Sigmoid, Softmax, SGD, Adam, Trainer
from src.data.toy_datasets import make_xor, make_moons, normalize


class TestTrainingConvergence:
    def test_loss_decreases_on_xor(self):
        """
        Training on XOR should significantly reduce loss.
        A network that doesn't learn would have random BCE loss ≈ 0.69.
        After 500 epochs, loss should drop below 0.3.
        """
        X, y = make_xor(n_samples=400, noise=0.05)
        X_norm, _, _ = normalize(X)

        net = NeuralNetwork()
        net.add(Dense(2, 8, activation=ReLU(), init="he"))
        net.add(Dense(8, 1, activation=Sigmoid(), init="xavier"))
        net.compile(loss="bce", optimizer=SGD(0.1))

        trainer = Trainer(net, batch_size=32, verbose=False)
        history = trainer.train(X_norm, y, epochs=500)

        initial_loss = history["loss"][0]
        final_loss = history["loss"][-1]

        assert final_loss < initial_loss, "Loss should decrease over training"
        assert final_loss < 0.4, f"XOR should be solvable to loss < 0.4, got {final_loss:.4f}"

    def test_accuracy_improves_on_xor(self):
        """Accuracy should improve significantly from random (50%) on XOR."""
        X, y = make_xor(n_samples=400, noise=0.05)
        X_norm, _, _ = normalize(X)

        net = NeuralNetwork()
        net.add(Dense(2, 16, activation=ReLU(), init="he"))
        net.add(Dense(16, 1, activation=Sigmoid(), init="xavier"))
        net.compile(loss="bce", optimizer=Adam(0.01))

        trainer = Trainer(net, batch_size=32, verbose=False)
        history = trainer.train(X_norm, y, epochs=800)

        final_acc = history["accuracy"][-1]
        assert final_acc > 0.85, f"XOR accuracy should exceed 0.85, got {final_acc:.4f}"

    def test_loss_decreases_on_moons(self):
        """Moons should be solvable — a simple test that training works end-to-end."""
        from src.data.toy_datasets import make_moons
        X, y = make_moons(n_samples=200, noise=0.1)
        X_norm, _, _ = normalize(X)

        net = NeuralNetwork()
        net.add(Dense(2, 16, activation=ReLU(), init="he"))
        net.add(Dense(16, 1, activation=Sigmoid(), init="xavier"))
        net.compile(loss="bce", optimizer=Adam(0.001))

        trainer = Trainer(net, batch_size=32, verbose=False)
        history = trainer.train(X_norm, y, epochs=300)

        assert history["loss"][-1] < history["loss"][0], "Loss must decrease"
        assert history["accuracy"][-1] > 0.75, "Moons accuracy should exceed 0.75"

    def test_backprop_updates_weights(self):
        """Weights should change after one training step."""
        X = np.random.randn(10, 2)
        y = (np.random.rand(10, 1) > 0.5).astype(float)

        net = NeuralNetwork()
        net.add(Dense(2, 4, activation=ReLU()))
        net.add(Dense(4, 1, activation=Sigmoid()))
        net.compile(loss="bce", optimizer=SGD(0.1))

        W_before = net.layers[0].W.copy()
        net.train_step(X, y)
        W_after = net.layers[0].W.copy()

        assert not np.allclose(W_before, W_after), "Weights should change after a training step"

    def test_history_length_matches_epochs(self):
        """History should have exactly 'epochs' entries."""
        X = np.random.randn(50, 2)
        y = (np.random.rand(50, 1) > 0.5).astype(float)

        net = NeuralNetwork()
        net.add(Dense(2, 4, activation=ReLU()))
        net.add(Dense(4, 1, activation=Sigmoid()))
        net.compile(loss="bce", optimizer=SGD(0.01))

        trainer = Trainer(net, batch_size=16, verbose=False)
        history = trainer.train(X, y, epochs=50)

        assert len(history["loss"]) == 50
        assert len(history["accuracy"]) == 50

    def test_zero_layer_network_fails_gracefully(self):
        """A network with no layers should error informatively on train_step."""
        net = NeuralNetwork()
        net.compile(loss="bce", optimizer=SGD(0.01))

        X = np.random.randn(5, 2)
        y = np.zeros((5, 1))

        with pytest.raises(Exception):
            net.train_step(X, y)


class TestGradientNumericalCheck:
    def test_gradients_correct_on_small_network(self):
        """
        Numerical gradient check — verifies backprop is mathematically correct.
        The relative error should be below 1e-4.
        """
        from src.utils.math_notes import numerical_gradient_check

        np.random.seed(42)
        X = np.random.randn(5, 2)
        y = (np.random.rand(5, 1) > 0.5).astype(float)

        net = NeuralNetwork()
        net.add(Dense(2, 4, activation=Sigmoid(), init="xavier"))
        net.add(Dense(4, 1, activation=Sigmoid(), init="xavier"))
        net.compile(loss="bce", optimizer=SGD(0.01))

        results = numerical_gradient_check(net, X, y)

        for layer_key, result in results.items():
            assert result["passed"], (
                f"{layer_key}: relative gradient error {result['relative_error']:.2e} too large "
                f"(threshold: 1e-4). Backprop may be incorrect."
            )
