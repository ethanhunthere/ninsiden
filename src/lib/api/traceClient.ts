import type { TraceCallbacks } from "../trace/types";

/**
 * Run a full trace by POSTing the prompt to the backend
 * and consuming the Server-Sent Events stream.
 *
 * Uses fetch + ReadableStream rather than EventSource because
 * SSE is initiated with a POST body.
 */
export async function runTrace(
  prompt: string,
  callbacks: TraceCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/trace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt }),
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    callbacks.onError?.(
      err instanceof Error ? err : new Error("Network error connecting to trace API.")
    );
    return;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore parse error
    }
    callbacks.onError?.(new Error(`Trace API error: ${detail}`));
    return;
  }

  if (!response.body) {
    callbacks.onError?.(new Error("No response body from trace API."));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on newlines; last element is a partial line — keep in buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const event = JSON.parse(raw);
          callbacks.onEvent(event);
          if (event.type === "model_token") {
            const token = (event.payload?.token as string) ?? "";
            if (token) callbacks.onToken?.(token);
          }
        } catch {
          // Malformed JSON — skip silently
        }
      }
    }

    callbacks.onDone?.();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    callbacks.onError?.(
      err instanceof Error ? err : new Error("Stream read error.")
    );
  } finally {
    reader.releaseLock();
  }
}
