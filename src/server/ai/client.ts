import "server-only";
import { type AiProvider, aiProviders } from "@/server/config/env";

/**
 * Minimal client for OpenAI-compatible Chat Completions APIs (Groq, Gemini,
 * xAI, OpenRouter, …). Providers are tried in order: when one is overloaded or
 * rate-limited, the request fails over to the next within the same time budget.
 */
export type ChatMessage = { role: "system" | "user"; content: string };

export type ResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: { name: string; strict: boolean; schema: Record<string, unknown> };
    };

export class AiProviderError extends Error {
  constructor(
    readonly kind: "timeout" | "network" | "http" | "empty",
    readonly status: number | null,
    readonly model: string,
    detail: string,
  ) {
    super(detail);
  }

  /** Worth trying the next provider: overload, rate limit, timeout, server error or blank reply. */
  get retryable(): boolean {
    if (this.kind !== "http") return true;
    return this.status === 429 || (this.status ?? 0) >= 500;
  }
}

/** Stays under the route's 60s maxDuration. */
const TOTAL_BUDGET_MS = 55_000;
const MIN_ATTEMPT_MS = 5_000;
/** An overloaded provider can hang for a minute; leave the backup time to answer. */
const ATTEMPT_CAP_WITH_BACKUP_MS = 25_000;

export async function createChatCompletion(request: {
  messages: ChatMessage[];
  responseFormat: ResponseFormat;
}): Promise<string> {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const providers = aiProviders();
  let lastError: AiProviderError | undefined;

  for (const [index, provider] of providers.entries()) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;
    const hasBackup = index < providers.length - 1;
    try {
      return await callProvider(provider, request, hasBackup ? Math.min(remaining, ATTEMPT_CAP_WITH_BACKUP_MS) : remaining);
    } catch (error) {
      if (!(error instanceof AiProviderError) || !error.retryable) throw error;
      console.warn(`[ai] ${provider.model} unavailable (${error.status ?? error.kind}); trying next provider`);
      lastError = error;
    }
  }
  throw lastError ?? new AiProviderError("timeout", null, providers[0].model, "Time budget exhausted");
}

async function callProvider(
  provider: AiProvider,
  request: { messages: ChatMessage[]; responseFormat: ResponseFormat },
  timeoutMs: number,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0,
        messages: request.messages,
        response_format: request.responseFormat,
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new AiProviderError(timedOut ? "timeout" : "network", null, provider.model, String(error));
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[ai] ${provider.model} HTTP ${response.status}: ${detail.slice(0, 500)}`);
    throw new AiProviderError("http", response.status, provider.model, detail.slice(0, 1_000));
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AiProviderError("empty", response.status, provider.model, "No content");
  return content;
}
