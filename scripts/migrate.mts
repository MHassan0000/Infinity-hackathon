/** Applies pending SQL migrations from ./drizzle. Safe to re-run. */
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./db.mts";

await migrate(db, { migrationsFolder: "drizzle" });
console.log("Database schema is up to date.");
