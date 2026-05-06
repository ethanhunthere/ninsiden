"""
Tests for forward pass — verifying shapes, values, and consistency.
"""

import numpy as np
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.nn.activations import ReLU, Sigmoid, Tanh, Softmax, Linear
from src.nn.layers import Dense
from src.nn.network import NeuralNetwork
from src.nn.optimizers import SGD


class TestActivations:
    def test_relu_forward_shape(self):
        relu = ReLU()
        x = np.random.randn(10, 5)
        out = relu.forward(x)
        assert out.shape == x.shape

    def test_relu_no_negative_output(self):
        relu = ReLU()
        x = np.random.randn(100, 10)
        out = relu.forward(x)
        assert np.all(out >= 0), "ReLU should produce no negative values"

    def test_sigmoid_output_range(self):
        sig = Sigmoid()
        x = np.random.randn(100, 5) * 100  # Extreme values
        out = sig.forward(x)
        # At extreme inputs float64 saturates to exactly 0.0 or 1.0 — that is correct behavior
        assert np.all(out >= 0) and np.all(out <= 1), "Sigmoid output must be in [0, 1]"

    def test_tanh_output_range(self):
        tanh = Tanh()
        x = np.random.randn(100, 5) * 100
        out = tanh.forward(x)
        # At extreme inputs float64 saturates to exactly ±1.0 — that is correct behavior
        assert np.all(out >= -1) and np.all(out <= 1), "Tanh output must be in [-1, 1]"

    def test_softmax_sums_to_one(self):
        softmax = Softmax()
        x = np.random.randn(10, 4)
        out = softmax.forward(x)
        row_sums = np.sum(out, axis=1)
        np.testing.assert_allclose(row_sums, np.ones(10), atol=1e-6,
                                   err_msg="Softmax rows must sum to 1")

    def test_softmax_non_negative(self):
        softmax = Softmax()
        x = np.random.randn(20, 3)
        out = softmax.forward(x)
        assert np.all(out >= 0), "Softmax outputs must be non-negative"

    def test_relu_backward_shape(self):
        relu = ReLU()
        x = np.random.randn(8, 4)
        _ = relu.forward(x)
        dA = np.random.randn(8, 4)
        dZ = relu.backward(dA)
        assert dZ.shape == dA.shape, "ReLU backward must preserve shape"

    def test_sigmoid_backward_shape(self):
        sig = Sigmoid()
        x = np.random.randn(8, 4)
        _ = sig.forward(x)
        dA = np.random.randn(8, 4)
        dZ = sig.backward(dA)
        assert dZ.shape == dA.shape

    def test_relu_backward_zero_on_neg(self):
        relu = ReLU()
        x = np.array([[-1.0, 2.0], [0.5, -3.0]])
        _ = relu.forward(x)
        dA = np.ones_like(x)
        dZ = relu.backward(dA)
        # Gradient should be 0 where x <= 0
        assert dZ[0, 0] == 0.0, "ReLU gradient should be 0 for negative input"
        assert dZ[1, 1] == 0.0, "ReLU gradient should be 0 for negative input"


class TestDenseLayer:
    def test_output_shape(self):
        layer = Dense(4, 8, activation=ReLU())
        X = np.random.randn(32, 4)  # batch=32, features=4
        out = layer.forward(X)
        assert out.shape == (32, 8), f"Expected (32, 8), got {out.shape}"

    def test_output_shape_no_activation(self):
        layer = Dense(3, 5)
        X = np.random.randn(16, 3)
        out = layer.forward(X)
        assert out.shape == (16, 5)

    def test_backward_shapes(self):
        layer = Dense(4, 8, activation=ReLU())
        X = np.random.randn(32, 4)
        _ = layer.forward(X)
        dA = np.random.randn(32, 8)
        dX = layer.backward(dA)
        assert dX.shape == X.shape, "dX must have same shape as input"
        assert layer.dW.shape == layer.W.shape, "dW must have same shape as W"
        assert layer.db.shape == layer.b.shape, "db must have same shape as b"

    def test_weights_initialized(self):
        layer = Dense(10, 20, init="he")
        assert layer.W.shape == (10, 20)
        assert layer.b.shape == (1, 20)
        # He init: std ≈ sqrt(2/10) ≈ 0.447
        assert abs(np.std(layer.W) - np.sqrt(2.0 / 10)) < 0.2

    def test_bias_zero_init(self):
        layer = Dense(5, 3)
        np.testing.assert_array_equal(layer.b, np.zeros((1, 3)))


class TestNetworkForward:
    def _make_network(self, multiclass=False) -> NeuralNetwork:
        net = NeuralNetwork()
        if multiclass:
            net.add(Dense(2, 8, activation=ReLU()))
            net.add(Dense(8, 3, activation=Softmax()))
            net.compile(loss="categorical_crossentropy", optimizer=SGD(0.01))
        else:
            net.add(Dense(2, 8, activation=ReLU()))
            net.add(Dense(8, 1, activation=Sigmoid()))
            net.compile(loss="bce", optimizer=SGD(0.01))
        return net

    def test_binary_output_shape(self):
        net = self._make_network(multiclass=False)
        X = np.random.randn(50, 2)
        out = net.forward(X)
        assert out.shape == (50, 1), f"Expected (50, 1), got {out.shape}"

    def test_binary_output_in_range(self):
        net = self._make_network(multiclass=False)
        X = np.random.randn(50, 2)
        out = net.forward(X)
        assert np.all(out >= 0) and np.all(out <= 1)

    def test_multiclass_output_shape(self):
        net = self._make_network(multiclass=True)
        X = np.random.randn(50, 2)
        out = net.forward(X)
        assert out.shape == (50, 3)

    def test_multiclass_sums_to_one(self):
        net = self._make_network(multiclass=True)
        X = np.random.randn(50, 2)
        out = net.forward(X)
        row_sums = out.sum(axis=1)
        np.testing.assert_allclose(row_sums, np.ones(50), atol=1e-5)

    def test_step_cache_populated(self):
        net = self._make_network()
        X = np.random.randn(5, 2)
        net.forward(X, capture_steps=True)
        assert len(net.step_cache) == len(net.layers)
        assert "Z" in net.step_cache[0]
        assert "A" in net.step_cache[0]

    def test_forward_deterministic(self):
        """Same input should always give same output (no randomness in forward pass)."""
        net = self._make_network()
        X = np.random.randn(10, 2)
        out1 = net.forward(X)
        out2 = net.forward(X)
        np.testing.assert_array_equal(out1, out2)
