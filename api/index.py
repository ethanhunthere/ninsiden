# Vercel Python serverless function entry point.
# Vercel picks up the `app` ASGI object from this file.
from app.main import app  # noqa: F401
