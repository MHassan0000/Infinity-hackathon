import "server-only";
import { aiEnv } from "@/server/config/env";

/**
 * Minimal client for any OpenAI-compatible Chat Completions API. Defaults to
 * xAI Grok; switching to a backup (e.g. OpenRouter) is a change of three env vars.
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
}

const TIMEOUT_MS = 55_000;

export async function createChatCompletion(request: {
  messages: ChatMessage[];
  responseFormat: ResponseFormat;
}): Promise<string> {
  const { AI_API_KEY, AI_BASE_URL, AI_MODEL } = aiEnv();

  let response: Response;
  try {
    response = await fetch(`${AI_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0,
        messages: request.messages,
        response_format: request.responseFormat,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new AiProviderError(timedOut ? "timeout" : "network", null, AI_MODEL, String(error));
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AiProviderError("http", response.status, AI_MODEL, detail.slice(0, 1_000));
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AiProviderError("empty", response.status, AI_MODEL, "No content");
  return content;
}
