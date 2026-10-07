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

export const aiEnv = () =>
  readEnv(
    "AI",
    z.object({
      AI_API_KEY: z.string().min(1),
      AI_BASE_URL: z.string().url().default("https://api.x.ai/v1"),
      AI_MODEL: z.string().min(1),
    }),
  );
