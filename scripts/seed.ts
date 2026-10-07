import "./load-env";
import { sql } from "drizzle-orm";
import { DEMO_PASSWORD, DEMO_USERS } from "@/domain/demo-users";
import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

/**
 * Seeds the ten demo accounts. Idempotent: upserts by email, so re-running
 * updates existing users instead of duplicating them.
 */
async function seed() {
  const rows = await Promise.all(
    DEMO_USERS.map(async (user) => ({ ...user, passwordHash: await hashPassword(DEMO_PASSWORD) })),
  );

  await db
    .insert(users)
    .values(rows)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: sql`excluded.name`,
        role: sql`excluded.role`,
        specialization: sql`excluded.specialization`,
        skills: sql`excluded.skills`,
        passwordHash: sql`excluded.password_hash`,
      },
    });

  console.log(`Seeded ${rows.length} demo users (password: ${DEMO_PASSWORD}).`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
