import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { getProject } from "@/server/data/projects";

/**
 * GET /api/projects/:projectId — one project with the tasks the signed-in user
 * may see. Projects outside the user's access return 404, same as missing ones.
 */
export async function GET(_request: Request, context: RouteContext<"/api/projects/[projectId]">) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { projectId } = await context.params;
  const project = await getProject(viewer, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  return NextResponse.json({ project });
}
