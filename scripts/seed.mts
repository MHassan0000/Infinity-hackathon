/**
 * Seeds the ten demo accounts. Idempotent: upserts by email, so re-running
 * updates existing users instead of duplicating them.
 */
import { sql } from "drizzle-orm";
import { DEMO_PASSWORD, DEMO_USERS } from "../src/domain/demo-users.ts";
import { hashPassword } from "../src/server/auth/password.ts";
import { db, schema } from "./db.mts";

const rows = await Promise.all(
  DEMO_USERS.map(async (user) => ({ ...user, passwordHash: await hashPassword(DEMO_PASSWORD) })),
);

await db
  .insert(schema.users)
  .values(rows)
  .onConflictDoUpdate({
    target: schema.users.email,
    set: {
      name: sql`excluded.name`,
      role: sql`excluded.role`,
      specialization: sql`excluded.specialization`,
      skills: sql`excluded.skills`,
      passwordHash: sql`excluded.password_hash`,
    },
  });

console.log(`Seeded ${rows.length} demo users (password: ${DEMO_PASSWORD}).`);
