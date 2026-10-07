import "server-only";
import { and, asc, count, eq, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { AppUser } from "@/domain/user";
import { db } from "@/server/db/client";
import { projects, tasks, users } from "@/server/db/schema";
import { projectAccess, taskAccess } from "./access-policy";

export type ProjectSummary = {
  id: string;
  name: string;
  clientName: string;
  description: string;
  deadline: string;
  manager: { id: string; name: string };
  /** Counts only the tasks the viewer may see. */
  taskCount: number;
  totalHours: number;
};

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  estimatedHours: number;
  assignee: { id: string; name: string; specialization: string };
};

export type ProjectDetail = ProjectSummary & { tasks: ProjectTask[] };

const isUuid = (value: string) => z.uuid().safeParse(value).success;

function selectSummaries(viewer: AppUser, filter?: SQL) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: projects.clientName,
      description: projects.description,
      deadline: projects.deadline,
      managerId: users.id,
      managerName: users.name,
      taskCount: count(tasks.id),
      totalHours: sql<number>`coalesce(sum(${tasks.estimatedHours}), 0)`.mapWith(Number),
    })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.managerId))
    .leftJoin(tasks, and(eq(tasks.projectId, projects.id), taskAccess(viewer)))
    .where(and(projectAccess(viewer), filter))
    .groupBy(projects.id, users.id)
    .orderBy(asc(projects.deadline), asc(projects.name));
}

type SummaryRow = Awaited<ReturnType<typeof selectSummaries>>[number];

const toSummary = ({ managerId, managerName, ...row }: SummaryRow): ProjectSummary => ({
  ...row,
  manager: { id: managerId, name: managerName },
});

/** Projects the viewer is allowed to see (`getProjects` in the brief). */
export async function listProjects(viewer: AppUser): Promise<ProjectSummary[]> {
  const rows = await selectSummaries(viewer);
  return rows.map(toSummary);
}

/** Tasks of one project, filtered by both project and task access. */
async function listProjectTasks(viewer: AppUser, projectId: string): Promise<ProjectTask[]> {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      deadline: tasks.deadline,
      estimatedHours: tasks.estimatedHours,
      assigneeId: users.id,
      assigneeName: users.name,
      assigneeSpecialization: users.specialization,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(users, eq(users.id, tasks.assigneeId))
    .where(and(eq(tasks.projectId, projectId), projectAccess(viewer), taskAccess(viewer)))
    .orderBy(asc(tasks.deadline), asc(tasks.title));

  return rows.map(({ assigneeId, assigneeName, assigneeSpecialization, ...task }) => ({
    ...task,
    assignee: { id: assigneeId, name: assigneeName, specialization: assigneeSpecialization },
  }));
}

/**
 * One project with the tasks the viewer may see, or null when the project does
 * not exist or is outside the viewer's access (`getProjectById` in the brief).
 */
export async function getProject(viewer: AppUser, projectId: string): Promise<ProjectDetail | null> {
  if (!isUuid(projectId)) return null;

  const [summaries, projectTasks] = await Promise.all([
    selectSummaries(viewer, eq(projects.id, projectId)),
    listProjectTasks(viewer, projectId),
  ]);

  const [summary] = summaries;
  return summary ? { ...toSummary(summary), tasks: projectTasks } : null;
}
