import "server-only";
import { asc, eq } from "drizzle-orm";
import type { AppUser } from "@/domain/user";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

/** Columns that are safe to expose. `passwordHash` is never selected here. */
const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  specialization: users.specialization,
  skills: users.skills,
};

export async function findUserById(id: string): Promise<AppUser | null> {
  const [user] = await db.select(publicColumns).from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/** Login only: the one place a password hash leaves the database. */
export async function findCredentialsByEmail(email: string) {
  const [row] = await db
    .select({ id: users.id, role: users.role, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

/** Read-only team directory, ordered admin → managers → developers. */
export async function listDirectory(): Promise<AppUser[]> {
  return db.select(publicColumns).from(users).orderBy(asc(users.role), asc(users.id));
}
