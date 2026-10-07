import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { AppUser, Role } from "@/domain/user";
import { findUserById } from "@/server/data/users";
import { readSessionUserId } from "./session";

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const userId = await readSessionUserId();
  return userId ? findUserById(userId) : null;
});

/** For pages: sends anonymous visitors to the login screen. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages restricted to one role: other roles get a 404, not a hint. */
export async function requireRole(role: Role): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== role) notFound();
  return user;
}
