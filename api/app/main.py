"""
NInsideN FastAPI application — main entry point.
Provides /api/health, /api/trace (SSE), /api/tokenize, and /api/next-tokens.
"""
import math

from fastapi import FastAPI, HTTPException, Query
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


@app.get("/api/tokenize")
async def tokenize_text(
    text: str = Query(default="Hello world", max_length=500, description="Text to tokenise"),
) -> dict:
    """
    Tokenise text using GPT-4 cl100k_base BPE (via tiktoken) or word-level fallback.
    Returns token list with type classification and the encoding method used.
    """
    from app.tokenizer import tokenize, METHOD  # type: ignore[attr-defined]

    tokens = tokenize(text)
    return {
        "tokens": tokens,
        "total":  len(tokens),
        "method": METHOD,
    }


# ── Demo next-token prediction fallbacks (used when OpenAI is unconfigured) ──
_NEXT_TOKEN_DEMOS: dict[str, list[dict]] = {
    "default": [
        {"token": "learns",    "prob": 0.28},
        {"token": "processes", "prob": 0.21},
        {"token": "predicts",  "prob": 0.16},
        {"token": "generates", "prob": 0.11},
        {"token": "computes",  "prob": 0.08},
    ],
    "the": [
        {"token": "model",       "prob": 0.31},
        {"token": "neural",      "prob": 0.22},
        {"token": "network",     "prob": 0.17},
        {"token": "transformer", "prob": 0.12},
        {"token": "system",      "prob": 0.08},
    ],
    "network": [
        {"token": "predicts",  "prob": 0.30},
        {"token": "learns",    "prob": 0.24},
        {"token": "processes", "prob": 0.18},
        {"token": "outputs",   "prob": 0.12},
        {"token": "generates", "prob": 0.09},
    ],
}


@app.get("/api/next-tokens")
async def next_tokens(
    prefix: str = Query(
        default="The neural network",
        max_length=200,
        description="Text prefix to predict the next token for",
    ),
) -> dict:
    """
    Return the top-5 next-token predictions for a text prefix.
    Uses real OpenAI completions API with logprobs when configured;
    falls back to a curated demo table otherwise.
    """
    if not settings.openai_configured:
        last_word = prefix.strip().split()[-1].lower() if prefix.strip() else ""
        demo = _NEXT_TOKEN_DEMOS.get(last_word, _NEXT_TOKEN_DEMOS["default"])
        return {"tokens": demo, "prefix": prefix, "method": "demo"}

    try:
        from openai import AsyncOpenAI
        from app.config import settings as cfg

        client = AsyncOpenAI(api_key=cfg.openai_api_key)
        response = await client.completions.create(
            model="gpt-3.5-turbo-instruct",
            prompt=prefix,
            max_tokens=1,
            logprobs=5,
            temperature=0,
        )
        top_logprobs: dict = response.choices[0].logprobs.top_logprobs[0]  # type: ignore[index]
        tokens = [
            {"token": k.strip(), "prob": round(math.exp(v), 4)}
            for k, v in top_logprobs.items()
        ]
        tokens.sort(key=lambda x: -x["prob"])
        return {"tokens": tokens[:5], "prefix": prefix, "method": "gpt-3.5-turbo-instruct"}

    except Exception:
        last_word = prefix.strip().split()[-1].lower() if prefix.strip() else ""
        demo = _NEXT_TOKEN_DEMOS.get(last_word, _NEXT_TOKEN_DEMOS["default"])
        return {"tokens": demo, "prefix": prefix, "method": "demo"}
