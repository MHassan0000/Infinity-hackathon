import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/current-user";
import { createProjectsFromTranscript, type PlanOutcome } from "@/server/services/transcript-service";

/** The AI call can take a while; allow the function time to finish. */
export const maxDuration = 60;

const requestSchema = z.object({ transcript: z.string().min(1) });

const STATUS: Record<PlanOutcome["status"], number> = {
  created: 201,
  "needs-review": 422,
  failed: 502,
};

/**
 * POST /api/transcript — JSON counterpart of the "Create from transcript"
 * screen. Admin only; same validation and all-or-nothing save.
 */
export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the administrator can create projects from a transcript." }, { status: 403 });
  }

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: 'Send JSON: { "transcript": "..." }' }, { status: 400 });
  }

  const outcome = await createProjectsFromTranscript(viewer, body.data.transcript);
  if (outcome.status === "created") revalidatePath("/", "layout");
  return NextResponse.json(outcome, { status: STATUS[outcome.status] });
}
