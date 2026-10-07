import "server-only";
import type { ProjectPlan } from "@/domain/plan";
import { db } from "@/server/db/client";
import { type NewProjectRow, type NewTaskRow, projects, tasks } from "@/server/db/schema";

export type CreatedProject = {
  id: string;
  name: string;
  taskCount: number;
  totalHours: number;
};

/**
 * Persists a validated plan all-or-nothing. IDs are generated here so tasks can
 * reference their project inside the same batch, which Neon runs as a single
 * transaction: either every project and task is saved, or none is.
 */
export async function savePlan(plan: ProjectPlan): Promise<CreatedProject[]> {
  const projectRows: NewProjectRow[] = [];
  const taskRows: NewTaskRow[] = [];
  const created: CreatedProject[] = [];

  for (const project of plan.projects) {
    const projectId = crypto.randomUUID();
    projectRows.push({
      id: projectId,
      name: project.name,
      clientName: project.clientName,
      description: project.description,
      managerId: project.managerId,
      deadline: project.deadline,
    });
    for (const task of project.tasks) {
      taskRows.push({
        id: crypto.randomUUID(),
        projectId,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        deadline: task.deadline,
        estimatedHours: task.estimatedHours,
      });
    }
    created.push({
      id: projectId,
      name: project.name,
      taskCount: project.tasks.length,
      totalHours: project.tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    });
  }

  const insertProjects = db.insert(projects).values(projectRows);
  if (taskRows.length === 0) {
    await insertProjects;
  } else {
    await db.batch([insertProjects, db.insert(tasks).values(taskRows)]);
  }
  return created;
}

/** Removes every generated project (tasks cascade). Seeded users are untouched. */
export async function deleteAllProjects(): Promise<number> {
  const deleted = await db.delete(projects).returning({ id: projects.id });
  return deleted.length;
}
