"""
Tokenizer module — uses tiktoken (GPT-4 BPE) when available,
falls back to a word-level educational tokenizer.
"""
import re
from typing import Literal

TokenType = Literal["word", "subword", "stop_word", "punctuation", "number", "space"]


# ── tiktoken BPE (preferred) ───────────────────────────────────────────────

try:
    import tiktoken as _tkt

    _enc = _tkt.get_encoding("cl100k_base")  # GPT-4 / GPT-3.5 encoding
    HAS_TIKTOKEN = True

    def tokenize(text: str) -> list[dict]:
        ids = _enc.encode(text)
        result: list[dict] = []
        for i, tid in enumerate(ids):
            piece = _enc.decode_single_token_bytes(tid).decode("utf-8", errors="replace")
            result.append(
                {
                    "id": i,
                    "text": piece,
                    "token_id": tid,
                    "type": _classify_bpe(piece),
                }
            )
        return result

    def _classify_bpe(piece: str) -> str:
        stripped = piece.strip()
        if not stripped:
            return "space"
        if re.match(r"^[^\w\s]+$", stripped):
            return "punctuation"
        if re.match(r"^\d+$", stripped):
            return "number"
        if stripped.lower() in _STOP_WORDS:
            return "stop_word"
        # BPE tokens that start with a space are word-boundary tokens
        if piece.startswith(" "):
            return "word"
        return "subword"

    METHOD = "cl100k_base BPE (GPT-4)"

except ImportError:
    HAS_TIKTOKEN = False

    def tokenize(text: str) -> list[dict]:  # type: ignore[misc]
        raw = re.findall(r"\w+|[^\w\s]", text, re.UNICODE)
        return [
            {"id": i, "text": tok, "token_id": i, "type": _classify_word(tok)}
            for i, tok in enumerate(raw)
        ]

    def _classify_word(tok: str) -> str:
        if re.match(r"^\d+$", tok):
            return "number"
        if re.match(r"^[^\w\s]+$", tok):
            return "punctuation"
        if tok.lower() in _STOP_WORDS:
            return "stop_word"
        return "word"

    METHOD = "word-level (install tiktoken for BPE)"


# ── Shared ─────────────────────────────────────────────────────────────────

_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "on",
    "at", "by", "for", "with", "about", "as", "into", "through", "from",
    "and", "or", "but", "not", "if", "it", "its", "that", "this", "how",
    "what", "why", "when", "where", "which", "who", "i", "you", "we",
    "they", "he", "she", "me", "him", "her", "us", "them",
}
