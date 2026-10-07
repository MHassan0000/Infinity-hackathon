import { redirect } from "next/navigation";
import { homePathFor } from "@/domain/user";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homePathFor(user.role) : "/login");
}
