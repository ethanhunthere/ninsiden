# Vercel Python serverless function entry point.
# Vercel runs this from the repo root, so we add api/ to sys.path
# before importing so `from app.main import app` resolves correctly.
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.main import app  # noqa: F401
