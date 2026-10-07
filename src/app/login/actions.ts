"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { homePathFor } from "@/domain/user";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { findCredentialsByEmail } from "@/server/data/users";

export type LoginState = { error: string } | null;

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and your password." };

  const account = await findCredentialsByEmail(parsed.data.email);
  const valid = account ? await verifyPassword(parsed.data.password, account.passwordHash) : false;
  if (!account || !valid) return { error: "Email or password is incorrect." };

  await createSession(account.id);
  redirect(homePathFor(account.role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
