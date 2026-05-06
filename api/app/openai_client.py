"""
OpenAI streaming client for NInsideN.

Uses the official OpenAI Python SDK with the Responses API (stream=True).
Reads credentials from environment variables only — never logs or exposes the key.
Falls back to a polished mock stream if OPENAI_API_KEY is not configured.
"""
import asyncio
import re
from collections.abc import AsyncGenerator
from typing import Any

from app.config import settings

SYSTEM_PROMPT = (
    "You are NInsideN's educational AI. Explain clearly and accurately. "
    "You help users understand AI, machine learning, neural networks, LLMs, "
    "RAG, tokens, context windows, and prompt-to-answer pipelines. "
    "Do not reveal or invent private chain-of-thought. "
    "Do not claim to show hidden model reasoning. "
    "Use the supplied context as educational support. "
    "If context is local/demo knowledge, do not pretend it is live web data. "
    "Keep answers structured, practical, and beginner-friendly without being childish."
)

_KEY_PATTERN = re.compile(r"sk-[A-Za-z0-9\-_]{10,}")


def _redact(text: str) -> str:
    """Remove any accidental API key leakage from error messages."""
    return _KEY_PATTERN.sub("[REDACTED]", text)


def _format_context(chunks: list[dict[str, Any]]) -> str:
    if not chunks:
        return "No retrieval context available."
    parts = []
    for i, chunk in enumerate(chunks, 1):
        label = chunk.get("label", "local demo knowledge — no live web search configured")
        parts.append(
            f"[{i}] {chunk.get('title', 'Untitled')} (source: {label})\n"
            f"{chunk.get('snippet', '')}"
        )
    return "\n\n".join(parts)


async def stream_openai(
    prompt: str,
    context_chunks: list[dict[str, Any]],
) -> AsyncGenerator[str, None]:
    """
    Stream response text from OpenAI using the Responses API.

    Yields individual text delta strings.
    If OPENAI_API_KEY is not set, yields mock tokens instead.
    Never logs or exposes the API key.
    """
    if not settings.openai_configured:
        async for token in _mock_stream(prompt):
            yield token
        return

    try:
        from openai import AsyncOpenAI
    except ImportError:
        yield "[openai package not installed — run: pip install openai]"
        return

    # Strip to neutralise any whitespace in the env value
    api_key = settings.openai_api_key.strip()
    client = AsyncOpenAI(api_key=api_key)
    context_text = _format_context(context_chunks)

    user_message = (
        "This is an educational visual trace inside NInsideN. "
        "The context below was retrieved from a local demo knowledge base "
        "(no live web search is configured in this deployment). "
        "Do not claim these are live sources.\n\n"
        f"Context:\n{context_text}\n\n"
        f"Question: {prompt}"
    )

    try:
        # Responses API — iterate events, yield text deltas
        async with client.responses.stream(
            model=settings.openai_model,
            instructions=SYSTEM_PROMPT,
            input=user_message,
            max_output_tokens=800,
        ) as stream:
            async for event in stream:
                if event.type == "response.output_text.delta":
                    delta: str = event.delta  # type: ignore[union-attr]
                    if delta:
                        yield delta
    except Exception as exc:
        safe = _redact(str(exc))[:300]
        raise RuntimeError(f"OpenAI API error: {safe}") from exc
    finally:
        await client.close()


async def _mock_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Polished mock stream used when no API key is configured.
    """
    topic = prompt.strip().rstrip("?").lower()
    answer = (
        f"This is a local demo response for: \"{topic}\".\n\n"
        "No OpenAI API key is configured. Set OPENAI_API_KEY in your "
        ".env.local file (local dev) or Vercel Environment Variables (production) "
        "to receive real AI responses.\n\n"
        "The visual trace pipeline above is fully functional — every step from "
        "prompt normalisation through intent detection, retrieval, and context "
        "assembly ran on real application logic. Only this final generation step "
        "is in fallback mode."
    )
    for word in answer.split(" "):
        yield word + " "
        await asyncio.sleep(0.03)

