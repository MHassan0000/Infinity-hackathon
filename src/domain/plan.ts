import { z } from "zod";

/**
 * Shape of a project plan extracted from a meeting transcript.
 *
 * The schema is deliberately lenient about *content* (missing values become
 * empty strings / 0) so that an incomplete AI answer can still be shown to the
 * administrator for correction. Business rules live in `validatePlan`.
 */
const text = z
  .string()
  .nullish()
  .transform((value) => (value ?? "").trim());

const hours = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : 0;
  });

export const planTaskSchema = z.object({
  title: text,
  description: text,
  assigneeId: text,
  deadline: text,
  estimatedHours: hours,
});

export const planProjectSchema = z.object({
  name: text,
  clientName: text,
  description: text,
  managerId: text,
  deadline: text,
  tasks: z.array(planTaskSchema).default([]),
});

export const projectPlanSchema = z.object({
  projects: z.array(planProjectSchema),
  /** Features, people or ideas the meeting explicitly ruled out. Informational only. */
  excluded: z.array(z.string()).default([]),
});

export type ProjectPlan = z.output<typeof projectPlanSchema>;
export type PlanProject = ProjectPlan["projects"][number];
export type PlanTask = PlanProject["tasks"][number];
