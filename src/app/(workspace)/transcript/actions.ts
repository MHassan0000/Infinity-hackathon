"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  createProjectsFromTranscript,
  type PlanOutcome,
  resetGeneratedProjects,
  saveReviewedPlan,
} from "@/server/services/transcript-service";

export type WorkbenchState = PlanOutcome | null;

const SESSION_EXPIRED: PlanOutcome = {
  status: "failed",
  message: "Your session has expired. Sign in again.",
};

/**
 * Single entry point for the workbench form:
 *  - intent "extract": transcript → AI → validate → save
 *  - intent "save-reviewed": corrected draft → validate → save (no AI call)
 * Authorization is re-checked inside the service; actions are public endpoints.
 */
export async function processTranscriptAction(
  _previous: WorkbenchState,
  formData: FormData,
): Promise<WorkbenchState> {
  const viewer = await getCurrentUser();
  if (!viewer) return SESSION_EXPIRED;

  let outcome: PlanOutcome;
  if (formData.get("intent") === "save-reviewed") {
    let draft: unknown;
    try {
      draft = JSON.parse(String(formData.get("plan") ?? ""));
    } catch {
      return { status: "failed", message: "The corrected plan is not valid JSON." };
    }
    outcome = await saveReviewedPlan(viewer, draft);
  } else {
    outcome = await createProjectsFromTranscript(viewer, String(formData.get("transcript") ?? ""));
  }

  if (outcome.status === "created") revalidatePath("/", "layout");
  return outcome;
}

export async function resetProjectsAction(): Promise<{ deleted: number } | { error: string }> {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return { error: "Only the administrator can reset projects." };
  }
  const deleted = await resetGeneratedProjects(viewer);
  revalidatePath("/", "layout");
  return { deleted };
}
