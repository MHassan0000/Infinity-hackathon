import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseEnv } from "@/server/config/env";
import * as schema from "./schema";

/**
 * Neon's HTTP driver: stateless, no connection pool to manage, ideal for
 * serverless functions. Multi-statement atomic writes go through `db.batch`,
 * which Neon executes as a single transaction.
 */
export const db = drizzle({ client: neon(databaseEnv().DATABASE_URL), schema });

export type Database = typeof db;
