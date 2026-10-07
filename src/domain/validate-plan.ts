import { isIsoDate } from "./dates";
import type { ProjectPlan } from "./plan";
import type { AppUser, Role } from "./user";

export type PlanIssue = {
  /** Machine path into the plan, e.g. `projects[1].tasks[3].assigneeId`. */
  path: string;
  /** Human location, e.g. `QuickServe Mobile App › Mobile integration and testing`. */
  context: string;
  message: string;
};

type DirectoryEntry = Pick<AppUser, "id" | "name" | "role">;

const ROLE_NOUN: Record<Exclude<Role, "ADMIN">, string> = {
  MANAGER: "project manager",
  AGENT: "developer",
};

/**
 * Checks every business rule a plan must satisfy before anything is saved.
 * Returns an empty array when the plan is safe to persist.
 */
export function validatePlan(
  plan: ProjectPlan,
  directory: readonly DirectoryEntry[],
): PlanIssue[] {
  const people = new Map(directory.map((person) => [person.id, person]));
  const issues: PlanIssue[] = [];
  const report = (path: string, context: string, message: string) =>
    issues.push({ path, context, message });

  const checkPerson = (id: string, role: "MANAGER" | "AGENT"): string | null => {
    if (!id) return `No ${ROLE_NOUN[role]} could be resolved from the transcript.`;
    const person = people.get(id);
    if (!person) return `"${id}" is not in the NovaWorks team directory.`;
    if (person.role !== role) return `${person.name} is not a ${ROLE_NOUN[role]}.`;
    return null;
  };

  if (plan.projects.length === 0) {
    report("projects", "Plan", "No projects were found in the transcript.");
  }

  plan.projects.forEach((project, p) => {
    const at = `projects[${p}]`;
    const context = project.name || `Project ${p + 1}`;
    const deadlineValid = isIsoDate(project.deadline);

    if (!project.name) report(`${at}.name`, context, "Project name is missing.");
    if (!project.clientName) report(`${at}.clientName`, context, "Client name is missing.");

    const managerProblem = checkPerson(project.managerId, "MANAGER");
    if (managerProblem) report(`${at}.managerId`, context, managerProblem);

    if (!deadlineValid) {
      report(`${at}.deadline`, context, "Project deadline is missing or is not a valid YYYY-MM-DD date.");
    }
    if (project.tasks.length === 0) {
      report(`${at}.tasks`, context, "Project has no tasks.");
    }

    project.tasks.forEach((task, t) => {
      const taskAt = `${at}.tasks[${t}]`;
      const taskContext = `${context} › ${task.title || `Task ${t + 1}`}`;

      if (!task.title) report(`${taskAt}.title`, taskContext, "Task title is missing.");

      const assigneeProblem = checkPerson(task.assigneeId, "AGENT");
      if (assigneeProblem) report(`${taskAt}.assigneeId`, taskContext, assigneeProblem);

      if (!(task.estimatedHours > 0)) {
        report(`${taskAt}.estimatedHours`, taskContext, "Estimated hours must be a positive number.");
      }

      if (!isIsoDate(task.deadline)) {
        report(`${taskAt}.deadline`, taskContext, "Task deadline is missing or is not a valid YYYY-MM-DD date.");
      } else if (deadlineValid && task.deadline > project.deadline) {
        report(
          `${taskAt}.deadline`,
          taskContext,
          `Task deadline ${task.deadline} is after the project deadline ${project.deadline}.`,
        );
      }
    });
  });

  return issues;
}
