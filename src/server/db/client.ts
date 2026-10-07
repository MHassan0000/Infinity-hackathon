import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseEnv } from "@/server/config/env";
import * as schema from "./schema";

/**
 * Retries a query once when the connection itself fails (no HTTP response).
 * Safe for writes too: rows carry application-generated UUIDs, so a replayed
 * insert hits the primary key instead of creating duplicates.
 */
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.warn("[db] connection failed, retrying once:", error);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return fetch(input, init);
  }
}

neonConfig.fetchFunction = fetchWithRetry;

/**
 * Neon's HTTP driver: stateless, no connection pool to manage, ideal for
 * serverless functions. Multi-statement atomic writes go through `db.batch`,
 * which Neon executes as a single transaction.
 */
export const db = drizzle({ client: neon(databaseEnv().DATABASE_URL), schema });

export type Database = typeof db;
