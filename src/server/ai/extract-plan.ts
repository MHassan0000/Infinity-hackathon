import "server-only";
import { COMPANY_TIMEZONE } from "@/domain/company";
import { todayIn } from "@/domain/dates";
import { type ProjectPlan, projectPlanSchema } from "@/domain/plan";
import type { AppUser } from "@/domain/user";
import { AiProviderError, type ChatMessage, createChatCompletion } from "./client";
import {
  buildPlanJsonSchema,
  buildSystemPrompt,
  buildUserPrompt,
  toAiDirectory,
} from "./plan-prompt";

/** A failure the administrator can act on; `message` is safe to show in the UI. */
export class PlanExtractionError extends Error {}

/** Sends the transcript and team directory to the model and returns its draft plan. */
export async function extractPlan(
  transcript: string,
  directory: readonly AppUser[],
): Promise<ProjectPlan> {
  const aiDirectory = toAiDirectory(directory);
  const schema = buildPlanJsonSchema(aiDirectory);
  const systemPrompt = buildSystemPrompt(todayIn(COMPANY_TIMEZONE));
  const userMessage: ChatMessage = { role: "user", content: buildUserPrompt(aiDirectory, transcript) };

  let content: string;
  try {
    content = await createChatCompletion({
      messages: [{ role: "system", content: systemPrompt }, userMessage],
      responseFormat: {
        type: "json_schema",
        json_schema: { name: "project_plan", strict: true, schema },
      },
    });
  } catch (error) {
    // Providers/models without JSON-schema output reject the request with 400:
    // retry once in plain JSON mode with the schema spelled out in the prompt.
    if (!(error instanceof AiProviderError && error.status === 400)) throw toExtractionError(error);
    try {
      content = await createChatCompletion({
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\nRespond with one JSON object conforming to this JSON Schema:\n${JSON.stringify(schema)}`,
          },
          userMessage,
        ],
        responseFormat: { type: "json_object" },
      });
    } catch (retryError) {
      throw toExtractionError(retryError);
    }
  }

  return parsePlan(content);
}

function parsePlan(content: string): ProjectPlan {
  const json = content.replace(/^```(?:json)?\s*|\s*```$/g, "");

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new PlanExtractionError("The AI response was not valid JSON. Try again.");
  }

  const parsed = projectPlanSchema.safeParse(data);
  if (!parsed.success) {
    throw new PlanExtractionError("The AI response did not match the project format. Try again.");
  }
  return parsed.data;
}

function toExtractionError(error: unknown): PlanExtractionError {
  console.error("[ai] plan extraction failed:", error);
  if (!(error instanceof AiProviderError)) {
    return new PlanExtractionError("The AI request failed unexpectedly. Try again.");
  }

  switch (error.kind) {
    case "timeout":
      return new PlanExtractionError("The AI provider took too long to respond. Try again.");
    case "network":
      return new PlanExtractionError("Could not reach the AI provider. Check the network connection.");
    case "empty":
      return new PlanExtractionError("The AI returned an empty response. Try again.");
    case "http":
      switch (error.status) {
        case 401:
          return new PlanExtractionError("The AI provider rejected the API key. Check AI_API_KEY.");
        case 403:
          return new PlanExtractionError("The AI provider denied the request. Check credits and model access.");
        case 404:
          return new PlanExtractionError(`The AI model "${error.model}" was not found. Check AI_MODEL.`);
        case 429:
          return new PlanExtractionError("The AI provider is rate-limiting requests. Wait a moment and try again.");
        default:
          return new PlanExtractionError(`The AI provider returned an error (${error.status}). Try again.`);
      }
  }
}
