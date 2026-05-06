"""
NInsideN FastAPI application — main entry point.
Provides /api/health and /api/trace (SSE streaming).
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import settings
from app.models import TraceRequest
from app.trace_engine import run_trace

app = FastAPI(
    title="NInsideN API",
    description="Observable AI pipeline trace engine.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)

# CORS — tighten in production to your actual domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://ninsiden.com",
        "https://www.ninsiden.com",
    ],
    # Allow Vercel preview deployment URLs (*.vercel.app)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "service": "NInsideN API",
        "openai_configured": settings.openai_configured,
        "model": settings.active_model,
    }


@app.post("/api/trace")
async def trace(request: TraceRequest) -> StreamingResponse:
    return StreamingResponse(
        run_trace(request.prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
