import { z } from "zod";

/**
 * Typed, validated access to server configuration. Each group is parsed lazily
 * so a missing AI key never breaks pages that only need the database.
 */
function readEnv<T extends z.ZodType>(group: string, schema: T): z.output<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid ${group} configuration: check ${missing} in .env.local`);
  }
  return result.data;
}

export const databaseEnv = () =>
  readEnv("database", z.object({ DATABASE_URL: z.string().min(1) }));

export const sessionEnv = () =>
  readEnv("session", z.object({ SESSION_SECRET: z.string().min(32) }));

export type AiProvider = { baseUrl: string; apiKey: string; model: string };

/**
 * AI providers in priority order: the primary (AI_*) and an optional backup
 * (AI_FALLBACK_*) used when the primary is overloaded or rate-limited.
 */
export function aiProviders(): AiProvider[] {
  const env = readEnv(
    "AI",
    z.object({
      AI_API_KEY: z.string().min(1),
      AI_BASE_URL: z.string().url(),
      AI_MODEL: z.string().min(1),
      AI_FALLBACK_API_KEY: z.string().optional(),
      AI_FALLBACK_BASE_URL: z.string().optional(),
      AI_FALLBACK_MODEL: z.string().optional(),
    }),
  );

  const providers: AiProvider[] = [
    { baseUrl: env.AI_BASE_URL, apiKey: env.AI_API_KEY, model: env.AI_MODEL },
  ];
  if (env.AI_FALLBACK_API_KEY && env.AI_FALLBACK_BASE_URL && env.AI_FALLBACK_MODEL) {
    providers.push({
      baseUrl: env.AI_FALLBACK_BASE_URL,
      apiKey: env.AI_FALLBACK_API_KEY,
      model: env.AI_FALLBACK_MODEL,
    });
  }
  return providers;
}
