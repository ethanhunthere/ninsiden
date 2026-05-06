"""
Tests for loss functions — verifying values, gradients, and edge cases.
"""

import numpy as np
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.nn.losses import MeanSquaredError, BinaryCrossEntropy, CategoricalCrossEntropy


class TestMSE:
    def test_perfect_prediction_zero_loss(self):
        mse = MeanSquaredError()
        y_pred = np.array([[1.0], [0.5], [2.0]])
        y_true = np.array([[1.0], [0.5], [2.0]])
        loss = mse.forward(y_pred, y_true)
        assert abs(loss) < 1e-10, "MSE should be 0 for perfect predictions"

    def test_known_value(self):
        mse = MeanSquaredError()
        y_pred = np.array([[2.0]])
        y_true = np.array([[0.0]])
        loss = mse.forward(y_pred, y_true)
        assert abs(loss - 4.0) < 1e-10, f"MSE of (2-0)^2 = 4, got {loss}"

    def test_gradient_shape(self):
        mse = MeanSquaredError()
        y_pred = np.random.randn(20, 1)
        y_true = np.random.randn(20, 1)
        mse.forward(y_pred, y_true)
        grad = mse.backward()
        assert grad.shape == y_pred.shape

    def test_gradient_direction(self):
        """Gradient should push prediction toward true value."""
        mse = MeanSquaredError()
        y_pred = np.array([[3.0]])
        y_true = np.array([[0.0]])
        mse.forward(y_pred, y_true)
        grad = mse.backward()
        assert grad[0, 0] > 0, "Gradient should be positive when prediction > true"

    def test_non_negative(self):
        mse = MeanSquaredError()
        y_pred = np.random.randn(100, 1)
        y_true = np.random.randn(100, 1)
        loss = mse.forward(y_pred, y_true)
        assert loss >= 0, "MSE must be non-negative"


class TestBinaryCrossEntropy:
    def test_perfect_prediction_low_loss(self):
        bce = BinaryCrossEntropy()
        y_pred = np.array([[0.999], [0.001], [0.999]])
        y_true = np.array([[1.0], [0.0], [1.0]])
        loss = bce.forward(y_pred, y_true)
        assert loss < 0.02, f"BCE for near-perfect predictions should be very low, got {loss}"

    def test_worst_prediction_high_loss(self):
        bce = BinaryCrossEntropy()
        y_pred = np.array([[0.001], [0.999]])
        y_true = np.array([[1.0], [0.0]])
        loss = bce.forward(y_pred, y_true)
        assert loss > 5.0, f"BCE for catastrophically wrong predictions should be very high, got {loss}"

    def test_non_negative(self):
        bce = BinaryCrossEntropy()
        y_pred = np.random.uniform(0.01, 0.99, (50, 1))
        y_true = (np.random.rand(50, 1) > 0.5).astype(float)
        loss = bce.forward(y_pred, y_true)
        assert loss >= 0

    def test_gradient_shape(self):
        bce = BinaryCrossEntropy()
        y_pred = np.random.uniform(0.1, 0.9, (20, 1))
        y_true = (np.random.rand(20, 1) > 0.5).astype(float)
        bce.forward(y_pred, y_true)
        grad = bce.backward()
        assert grad.shape == y_pred.shape

    def test_symmetric_loss(self):
        """Loss for predicting 0.7 when true=1 should equal loss for predicting 0.3 when true=0."""
        bce = BinaryCrossEntropy()
        loss1 = bce.forward(np.array([[0.7]]), np.array([[1.0]]))
        loss2 = bce.forward(np.array([[0.3]]), np.array([[0.0]]))
        assert abs(loss1 - loss2) < 1e-10


class TestCategoricalCrossEntropy:
    def test_perfect_prediction_zero_loss(self):
        cce = CategoricalCrossEntropy()
        y_pred = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])
        y_true = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])
        loss = cce.forward(y_pred, y_true)
        assert loss < 1e-5, f"CCE for perfect predictions should be near 0, got {loss}"

    def test_non_negative(self):
        cce = CategoricalCrossEntropy()
        y_pred = np.array([[0.7, 0.2, 0.1], [0.1, 0.6, 0.3]])
        y_true = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])
        loss = cce.forward(y_pred, y_true)
        assert loss >= 0

    def test_gradient_shape(self):
        cce = CategoricalCrossEntropy()
        n, c = 15, 3
        y_pred = np.random.dirichlet(np.ones(c), n)  # Valid probability distributions
        y_true = np.eye(c)[np.random.randint(0, c, n)]
        cce.forward(y_pred, y_true)
        grad = cce.backward()
        assert grad.shape == y_pred.shape

    def test_uniform_prediction_entropy(self):
        """Uniform prediction for 4 classes should give loss = log(4) ≈ 1.386."""
        cce = CategoricalCrossEntropy()
        n, c = 100, 4
        y_pred = np.full((n, c), 1.0 / c)
        y_true = np.eye(c)[np.random.randint(0, c, n)]
        loss = cce.forward(y_pred, y_true)
        expected = np.log(c)
        assert abs(loss - expected) < 0.01, f"Expected ~{expected:.4f}, got {loss:.4f}"
