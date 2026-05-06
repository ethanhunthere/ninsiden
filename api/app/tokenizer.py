"""
Simple word-level tokenizer for educational demonstration.
Splits on whitespace and punctuation, returning token objects.
"""
import re


def tokenize(text: str) -> list[dict]:
    """
    Tokenize text into a list of token objects.
    This is a simplified demonstration tokenizer (not BPE/WordPiece).
    """
    # Split on whitespace and punctuation boundaries
    raw_tokens = re.findall(r"\w+|[^\w\s]", text, re.UNICODE)
    tokens = []
    for idx, tok in enumerate(raw_tokens):
        tokens.append(
            {
                "id": idx,
                "text": tok,
                "type": _classify_token(tok),
            }
        )
    return tokens


def _classify_token(tok: str) -> str:
    if re.match(r"^\d+$", tok):
        return "number"
    if re.match(r"^[^\w\s]+$", tok):
        return "punctuation"
    if tok.lower() in _STOP_WORDS:
        return "stop_word"
    return "word"


_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "on",
    "at", "by", "for", "with", "about", "as", "into", "through", "from",
    "and", "or", "but", "not", "if", "it", "its", "that", "this", "how",
    "what", "why", "when", "where", "which", "who", "i", "you", "we",
    "they", "he", "she", "me", "him", "her", "us", "them",
}
