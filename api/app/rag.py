"""
Intent detection — simple keyword-rule classifier.
Maps user prompts to one of the known intent categories.
"""
import re

_INTENT_PATTERNS: dict[str, list[str]] = {
    "backpropagation": [
        r"backprop", r"backward\s*pass", r"chain\s*rule", r"gradient\s*flow",
    ],
    "gradient_descent": [
        r"gradient\s*descent", r"learning\s*rate", r"sgd", r"\badam\b",
        r"optimizer", r"optimis", r"minimize.*loss", r"loss.*surface",
    ],
    "neural_networks": [
        r"neural\s*network", r"neuron", r"hidden\s*layer", r"activation\s*function",
        r"deep\s*learn", r"weight.*bias", r"perceptron", r"forward\s*pass",
    ],
    "rag": [
        r"\brag\b", r"retrieval.augmented", r"retrieval\s*augmented",
        r"retriev", r"knowledge\s*base", r"vector\s*search", r"document.*embed",
    ],
    "tokens": [
        r"token", r"tokeniz", r"byte\s*pair", r"bpe\b", r"wordpiece",
        r"vocabulary", r"text\s*to\s*num",
    ],
    "embeddings": [
        r"embedding", r"semantic\s*vector", r"dense\s*vector",
        r"similarity\s*search", r"vector\s*space",
    ],
    "transformers": [
        r"transformer", r"self.attention", r"attention\s*head", r"\bgpt\b",
        r"\bbert\b", r"\bllm\b", r"large\s*language\s*model",
    ],
    "streaming": [
        r"stream", r"token\s*by\s*token", r"sse\b", r"server.sent",
        r"real.time\s*generat",
    ],
    "agents": [
        r"\bagent\b", r"tool\s*use", r"multi.step\s*reason", r"agentic",
        r"autonomous", r"function\s*call",
    ],
    "general_ai": [
        r"artificial\s*intelligence", r"\bai\b", r"machine\s*learn",
        r"how.*prompt.*answer", r"how.*ai\s*works", r"how.*ai\s*process",
    ],
}


def detect_intent(prompt: str) -> str:
    """Return the best-matching intent category for the given prompt."""
    lower = prompt.lower()
    scores: dict[str, int] = {}
    for intent, patterns in _INTENT_PATTERNS.items():
        hit = sum(1 for p in patterns if re.search(p, lower))
        if hit > 0:
            scores[intent] = hit
    if not scores:
        return "unknown"
    return max(scores, key=lambda k: scores[k])


def generate_retrieval_query(prompt: str, intent: str) -> str:
    """Generate a simple retrieval query from the user's prompt."""
    # Strip stop-words for a cleaner retrieval query
    _STOP = {
        "a", "an", "the", "is", "are", "was", "were", "i", "you",
        "how", "what", "why", "when", "does", "do", "can", "could",
        "please", "explain", "describe", "tell", "me", "show", "like",
    }
    words = re.findall(r"\w+", prompt.lower())
    keywords = [w for w in words if w not in _STOP and len(w) > 2]
    base = " ".join(keywords[:8])
    return f"{intent.replace('_', ' ')} {base}".strip()
