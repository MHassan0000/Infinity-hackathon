/**
 * Database client for CLI scripts. Runs on plain Node (built-in TypeScript
 * support), so imports use relative paths with explicit extensions.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/server/db/schema.ts";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: rely on variables already set in the environment.
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local.");

export const db = drizzle({ client: neon(url), schema });
export { schema };
