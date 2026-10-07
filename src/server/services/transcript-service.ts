import "server-only";
import { type ProjectPlan, projectPlanSchema } from "@/domain/plan";
import type { AppUser } from "@/domain/user";
import { type PlanIssue, validatePlan } from "@/domain/validate-plan";
import { extractPlan, PlanExtractionError } from "@/server/ai/extract-plan";
import { type CreatedProject, deleteAllProjects, savePlan } from "@/server/data/plans";
import { listDirectory } from "@/server/data/users";

export type PlanOutcome =
  | { status: "created"; projects: CreatedProject[]; excluded: string[] }
  | { status: "needs-review"; plan: ProjectPlan; issues: PlanIssue[] }
  | { status: "failed"; message: string };

const MAX_TRANSCRIPT_LENGTH = 100_000;

const failed = (message: string): PlanOutcome => ({ status: "failed", message });

const ADMIN_ONLY = "Only the administrator can create projects from a transcript.";

/**
 * Use case: Create from Transcript.
 * transcript → AI draft → validation → atomic save. Nothing is saved unless the
 * whole plan passes validation; otherwise the draft comes back for correction.
 */
export async function createProjectsFromTranscript(
  viewer: AppUser,
  transcript: string,
): Promise<PlanOutcome> {
  if (viewer.role !== "ADMIN") return failed(ADMIN_ONLY);

  const text = transcript.trim();
  if (!text) return failed("Paste a meeting transcript first.");
  if (text.length > MAX_TRANSCRIPT_LENGTH) return failed("This transcript is too long to process.");

  const directory = await listDirectory();

  let plan: ProjectPlan;
  try {
    plan = await extractPlan(text, directory);
  } catch (error) {
    if (error instanceof PlanExtractionError) return failed(error.message);
    throw error;
  }

  return validateAndSave(plan, directory);
}

/**
 * Use case: save a draft the administrator corrected after review.
 * Re-validates from scratch without calling the AI again.
 */
export async function saveReviewedPlan(viewer: AppUser, draft: unknown): Promise<PlanOutcome> {
  if (viewer.role !== "ADMIN") return failed(ADMIN_ONLY);

  const parsed = projectPlanSchema.safeParse(draft);
  if (!parsed.success) return failed("The corrected plan is not in the expected format.");

  return validateAndSave(parsed.data, await listDirectory());
}

/** Use case: clear generated projects/tasks between demo runs. Users are kept. */
export async function resetGeneratedProjects(viewer: AppUser): Promise<number> {
  if (viewer.role !== "ADMIN") throw new Error(ADMIN_ONLY);
  return deleteAllProjects();
}

async function validateAndSave(plan: ProjectPlan, directory: AppUser[]): Promise<PlanOutcome> {
  const issues = validatePlan(plan, directory);
  if (issues.length > 0) return { status: "needs-review", plan, issues };

  const projects = await savePlan(plan);
  return { status: "created", projects, excluded: plan.excluded };
}
