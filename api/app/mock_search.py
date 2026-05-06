"""
Mock local knowledge base used when no live search API is configured.
All sources are clearly labelled as local demo knowledge.
"""

_KNOWLEDGE_BASE: list[dict] = [
    {
        "id": "local-nn-001",
        "title": "Neural Networks: Internal Learning Flow",
        "type": "local_demo_knowledge",
        "relevance_base": 0.92,
        "tags": ["neural_networks", "learning", "weights"],
        "snippet": (
            "A neural network learns by adjusting its weights through a process called "
            "backpropagation. During the forward pass, the network computes predictions. "
            "During the backward pass, gradients of the loss function are propagated back "
            "through the layers, and weights are updated proportionally to these gradients "
            "via an optimizer such as SGD or Adam."
        ),
    },
    {
        "id": "local-bp-001",
        "title": "Backpropagation: Gradient Flow Through Layers",
        "type": "local_demo_knowledge",
        "relevance_base": 0.89,
        "tags": ["backpropagation", "gradients", "chain_rule", "neural_networks"],
        "snippet": (
            "Backpropagation applies the chain rule of calculus to compute the gradient of "
            "the loss with respect to every weight in the network. Starting from the output "
            "layer, it works backwards, multiplying local Jacobians at each layer. This "
            "process is efficient because it reuses intermediate activations stored during "
            "the forward pass."
        ),
    },
    {
        "id": "local-gd-001",
        "title": "Gradient Descent and Optimization",
        "type": "local_demo_knowledge",
        "relevance_base": 0.87,
        "tags": ["gradient_descent", "optimization", "learning_rate", "adam"],
        "snippet": (
            "Gradient descent updates model weights in the direction that reduces the loss. "
            "The learning rate controls step size. Stochastic Gradient Descent (SGD) "
            "uses mini-batches for efficiency. Adam optimizer combines momentum and "
            "adaptive learning rates, making it the default choice for most deep learning tasks."
        ),
    },
    {
        "id": "local-rag-001",
        "title": "Retrieval-Augmented Generation (RAG): Architecture Overview",
        "type": "local_demo_knowledge",
        "relevance_base": 0.94,
        "tags": ["rag", "retrieval", "context", "embeddings"],
        "snippet": (
            "RAG (Retrieval-Augmented Generation) enhances LLM responses by first retrieving "
            "relevant documents from a knowledge base, then including them as context in the "
            "prompt. The retrieval step typically uses dense vector embeddings and "
            "approximate nearest-neighbor search. This allows the model to answer questions "
            "about private or recent data without fine-tuning."
        ),
    },
    {
        "id": "local-tok-001",
        "title": "Tokenization: From Text to Token IDs",
        "type": "local_demo_knowledge",
        "relevance_base": 0.86,
        "tags": ["tokens", "tokenization", "bpe", "vocabulary"],
        "snippet": (
            "LLMs do not process raw text — they operate on tokens, which are sub-word units "
            "produced by algorithms like Byte-Pair Encoding (BPE) or WordPiece. A typical "
            "vocabulary has 32k–100k tokens. Tokenization affects how the model handles "
            "rare words, multilingual text, and code. Token count determines context window usage."
        ),
    },
    {
        "id": "local-emb-001",
        "title": "Embeddings: Meaning as Vectors",
        "type": "local_demo_knowledge",
        "relevance_base": 0.85,
        "tags": ["embeddings", "vectors", "semantic_search", "similarity"],
        "snippet": (
            "An embedding is a dense vector of floating-point numbers that captures the "
            "semantic meaning of text. Similar texts have vectors close in high-dimensional "
            "space. Embeddings power semantic search, clustering, and retrieval in RAG "
            "systems. Popular embedding models include OpenAI text-embedding-3 and "
            "Sentence-BERT variants."
        ),
    },
    {
        "id": "local-transformer-001",
        "title": "Transformers: Attention-Based Architecture",
        "type": "local_demo_knowledge",
        "relevance_base": 0.91,
        "tags": ["transformers", "attention", "gpt", "bert", "architecture"],
        "snippet": (
            "The Transformer architecture (Vaswani et al., 2017) replaced recurrence with "
            "self-attention, allowing parallel processing of sequences. Each token attends to "
            "all other tokens in the sequence. GPT-style models use causal (masked) "
            "self-attention for autoregressive generation. The attention mechanism computes "
            "queries, keys, and values from the token embeddings."
        ),
    },
    {
        "id": "local-ctx-001",
        "title": "Context Windows: What the Model Sees",
        "type": "local_demo_knowledge",
        "relevance_base": 0.88,
        "tags": ["context_window", "tokens", "prompt", "model"],
        "snippet": (
            "The context window is the maximum number of tokens a model can process at once. "
            "Modern LLMs range from 4k to 1M+ tokens. The app-level context window typically "
            "contains: the system prompt, conversation history, retrieved knowledge chunks, "
            "and the current user message. Filling this efficiently is a core RAG engineering challenge."
        ),
    },
    {
        "id": "local-stream-001",
        "title": "Streaming Responses: Token-by-Token Generation",
        "type": "local_demo_knowledge",
        "relevance_base": 0.83,
        "tags": ["streaming", "tokens", "generation", "sse"],
        "snippet": (
            "LLMs generate text one token at a time. Streaming allows the application to "
            "display tokens as they arrive rather than waiting for the full response. "
            "This is implemented via Server-Sent Events (SSE) or WebSockets. The OpenAI "
            "Chat Completions API supports streaming via 'stream: true', returning "
            "delta chunks in the response body."
        ),
    },
    {
        "id": "local-agents-001",
        "title": "AI Agents: Tool Use and Multi-Step Reasoning",
        "type": "local_demo_knowledge",
        "relevance_base": 0.80,
        "tags": ["agents", "tools", "reasoning", "ai"],
        "snippet": (
            "AI agents extend LLMs with the ability to call external tools (web search, code "
            "execution, APIs) and reason across multiple steps. Frameworks like LangChain, "
            "CrewAI, and AutoGen provide agent orchestration. Agents maintain a scratchpad "
            "of observations and actions, deciding what to do next based on the task and "
            "available tool results."
        ),
    },
]

# Map intent → relevant tags
_INTENT_TAG_MAP: dict[str, list[str]] = {
    "neural_networks": ["neural_networks", "learning", "weights", "backpropagation"],
    "backpropagation": ["backpropagation", "gradients", "chain_rule", "neural_networks"],
    "gradient_descent": ["gradient_descent", "optimization", "learning_rate"],
    "rag": ["rag", "retrieval", "context", "embeddings"],
    "tokens": ["tokens", "tokenization", "bpe"],
    "embeddings": ["embeddings", "vectors", "semantic_search"],
    "transformers": ["transformers", "attention", "architecture"],
    "context_window": ["context_window", "tokens", "prompt"],
    "streaming": ["streaming", "tokens", "generation", "sse"],
    "agents": ["agents", "tools", "reasoning"],
    "general_ai": ["neural_networks", "rag", "transformers", "tokens"],
    "unknown": ["neural_networks", "tokens", "context_window"],
}


def mock_search(query: str, intent: str, max_results: int = 3) -> list[dict]:
    """
    Return relevant local demo knowledge entries for the given intent/query.
    All results are clearly marked as local demo knowledge — not live web data.
    """
    relevant_tags = set(_INTENT_TAG_MAP.get(intent, _INTENT_TAG_MAP["unknown"]))

    scored: list[tuple[float, dict]] = []
    query_lower = query.lower()

    for entry in _KNOWLEDGE_BASE:
        entry_tags = set(entry["tags"])
        overlap = len(relevant_tags & entry_tags)
        query_hit = any(word in entry["snippet"].lower() for word in query_lower.split() if len(word) > 3)

        score = entry["relevance_base"] * (0.6 + 0.3 * min(overlap, 3) / 3 + 0.1 * query_hit)
        scored.append((score, entry))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, entry in scored[:max_results]:
        results.append(
            {
                **entry,
                "relevance": round(score, 3),
                "label": "Local demo knowledge — no live web search configured",
            }
        )
    return results
