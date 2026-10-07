import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { listProjects } from "@/server/data/projects";

/** GET /api/projects — the projects the signed-in user may see. */
export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  return NextResponse.json({ projects: await listProjects(viewer) });
}
