"""
NInsideN trace engine — orchestrates the full observable AI pipeline.

Emits Server-Sent Events for every step:
  trace_started → prompt_received → prompt_normalized → tokens_created
  → intent_detected → retrieval_plan_created → query_generated
  → search_started → source_found(s) → chunk_selected(s)
  → context_built → model_request_started → model_token(s)
  → model_response_completed → answer_completed → trace_completed

Does NOT claim to expose private model chain-of-thought.
Shows only the transparent, observable, application-level pipeline.
"""
import asyncio
import re
from collections.abc import AsyncGenerator

from app.config import settings
from app.mock_search import mock_search
from app.openai_client import stream_openai
from app.rag import detect_intent, generate_retrieval_query
from app.tokenizer import tokenize
from app.utils import make_event


async def run_trace(prompt: str) -> AsyncGenerator[str, None]:
    """
    Full async generator that yields SSE-formatted strings for every
    observable step in the NInsideN prompt-to-answer pipeline.
    """
    # ── 1. Trace started ────────────────────────────────────────────────────
    yield make_event(
        "trace_started",
        "Trace started",
        "NInsideN trace engine initialised. Observable pipeline beginning.",
        {"openai_configured": settings.openai_configured, "model": settings.active_model},
    )
    await asyncio.sleep(0.05)

    # ── 2. Prompt received ───────────────────────────────────────────────────
    yield make_event(
        "prompt_received",
        "Prompt received",
        "The prompt entered the NInsideN trace engine.",
        {"prompt": prompt, "length": len(prompt)},
    )
    await asyncio.sleep(0.1)

    # ── 3. Prompt normalised ─────────────────────────────────────────────────
    normalized = _normalize(prompt)
    yield make_event(
        "prompt_normalized",
        "Prompt normalised",
        "Whitespace normalised, control characters removed.",
        {"original_length": len(prompt), "normalized": normalized},
    )
    await asyncio.sleep(0.1)

    # ── 4. Tokens created ────────────────────────────────────────────────────
    tokens = tokenize(normalized)
    token_texts = [t["text"] for t in tokens]
    yield make_event(
        "tokens_created",
        "Tokens created",
        f"Prompt split into {len(tokens)} tokens using word-level tokenisation (demo).",
        {"tokens": token_texts, "count": len(tokens)},
    )
    await asyncio.sleep(0.15)

    # ── 5. Intent detected ───────────────────────────────────────────────────
    intent = detect_intent(normalized)
    intent_label = intent.replace("_", " ").title()
    yield make_event(
        "intent_detected",
        "Intent detected",
        f"Classified prompt intent as '{intent_label}' using keyword pattern matching.",
        {"intent": intent, "intent_label": intent_label},
    )
    await asyncio.sleep(0.12)

    # ── 6. Retrieval plan created ────────────────────────────────────────────
    yield make_event(
        "retrieval_plan_created",
        "Retrieval plan created",
        "A retrieval strategy was selected based on the detected intent.",
        {"strategy": "local_demo_search", "intent": intent},
    )
    await asyncio.sleep(0.1)

    # ── 7. Query generated ───────────────────────────────────────────────────
    query = generate_retrieval_query(normalized, intent)
    yield make_event(
        "query_generated",
        "Retrieval query generated",
        "A focused search query was derived from the prompt and detected intent.",
        {"query": query},
    )
    await asyncio.sleep(0.1)

    # ── 8. Search started ────────────────────────────────────────────────────
    yield make_event(
        "search_started",
        "Search started",
        "Querying the local demo knowledge base. No live web search is configured in v1.",
        {"source": "local_demo_knowledge", "query": query},
    )
    await asyncio.sleep(0.2)

    # ── 9. Source found events ───────────────────────────────────────────────
    sources = mock_search(query, intent, max_results=3)
    for source in sources:
        yield make_event(
            "source_found",
            f"Source found: {source['title']}",
            f"Relevance: {source['relevance']:.2f} — {source['label']}",
            source,
        )
        await asyncio.sleep(0.18)

    # ── 10. Chunk selected events ────────────────────────────────────────────
    chunks = sources  # In v1, each source maps to one chunk
    for chunk in chunks:
        yield make_event(
            "chunk_selected",
            f"Chunk selected: {chunk['title']}",
            "This context chunk was selected for inclusion in the model context window.",
            {
                "id": chunk["id"],
                "title": chunk["title"],
                "snippet": chunk["snippet"],
                "relevance": chunk["relevance"],
            },
        )
        await asyncio.sleep(0.12)

    # ── 11. Context built ────────────────────────────────────────────────────
    combined_context = "\n\n".join(c["snippet"] for c in chunks)
    token_estimate = len(combined_context.split()) * 4 // 3  # rough estimate
    yield make_event(
        "context_built",
        "Context window assembled",
        f"Context package built with {len(chunks)} chunk(s), ~{token_estimate} tokens estimated.",
        {
            "chunk_count": len(chunks),
            "token_estimate": token_estimate,
            "context_preview": combined_context[:300] + "..." if len(combined_context) > 300 else combined_context,
        },
    )
    await asyncio.sleep(0.15)

    # ── 12. Model request started ────────────────────────────────────────────
    model_label = settings.active_model
    if not settings.openai_configured:
        yield make_event(
            "model_request_started",
            "Model request started (fallback mode)",
            "OpenAI API key not configured. Using local fallback response. "
            "Set OPENAI_API_KEY to enable real AI responses.",
            {"model": "local-fallback", "openai_configured": False, "stream": True},
        )
    else:
        yield make_event(
            "model_request_started",
            "Model request started",
            f"Sending prompt + context to {model_label} via OpenAI. Streaming mode enabled.",
            {"model": model_label, "openai_configured": True, "stream": True},
        )
    await asyncio.sleep(0.1)

    # ── 13. Stream model tokens ──────────────────────────────────────────────
    full_answer = ""
    try:
        async for token in stream_openai(prompt, chunks):
            full_answer += token
            yield make_event(
                "model_token",
                "Token streamed",
                "",
                {"token": token},
            )
    except Exception as exc:
        safe_message = re.sub(r"sk-[A-Za-z0-9\-_]{10,}", "[REDACTED]", str(exc))[:300]
        yield make_event(
            "error",
            "Model error",
            f"An error occurred while streaming from the model: {safe_message}",
            {"recoverable": True},
        )
        from app.answer_fallback import stream_fallback
        async for token in stream_fallback(prompt):
            full_answer += token
            yield make_event(
                "model_token",
                "Fallback token",
                "",
                {"token": token, "fallback": True},
            )

    # ── 14. Response completed ───────────────────────────────────────────────
    yield make_event(
        "model_response_completed",
        "Model response completed",
        "All tokens have been received from the model.",
        {"total_tokens_approximate": len(full_answer.split())},
    )
    await asyncio.sleep(0.05)

    # ── 15. Answer completed ─────────────────────────────────────────────────
    yield make_event(
        "answer_completed",
        "Answer assembled",
        "The final answer has been assembled from the streamed token sequence.",
        {
            "answer_length": len(full_answer),
            "source_count": len(sources),
            "sources": [{"id": s["id"], "title": s["title"]} for s in sources],
        },
    )
    await asyncio.sleep(0.05)

    # ── 16. Trace completed ──────────────────────────────────────────────────
    yield make_event(
        "trace_completed",
        "Trace completed",
        "NInsideN observable pipeline trace finished successfully.",
        {
            "steps_completed": 16,
            "model": model_label,
            "openrouter_configured": settings.openrouter_configured,
        },
    )


def _normalize(text: str) -> str:
    """Collapse whitespace, strip leading/trailing space."""
    return re.sub(r"\s+", " ", text).strip()
