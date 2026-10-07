import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { listAssignedTasks } from "@/server/data/tasks";

/** GET /api/tasks — tasks assigned to the signed-in user. */
export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  return NextResponse.json({ tasks: await listAssignedTasks(viewer) });
}
