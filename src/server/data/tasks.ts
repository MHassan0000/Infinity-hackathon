import "server-only";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { AppUser } from "@/domain/user";
import { db } from "@/server/db/client";
import { projects, tasks, users } from "@/server/db/schema";

export type AssignedTask = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  estimatedHours: number;
  project: { id: string; name: string; clientName: string; deadline: string; managerName: string };
};

const manager = alias(users, "manager");

/** "My tasks": only tasks assigned to the viewer, with their project context. */
export async function listAssignedTasks(viewer: AppUser): Promise<AssignedTask[]> {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      deadline: tasks.deadline,
      estimatedHours: tasks.estimatedHours,
      projectId: projects.id,
      projectName: projects.name,
      clientName: projects.clientName,
      projectDeadline: projects.deadline,
      managerName: manager.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(manager, eq(manager.id, projects.managerId))
    .where(eq(tasks.assigneeId, viewer.id))
    .orderBy(asc(tasks.deadline), asc(tasks.title));

  return rows.map(({ projectId, projectName, clientName, projectDeadline, managerName, ...task }) => ({
    ...task,
    project: { id: projectId, name: projectName, clientName, deadline: projectDeadline, managerName },
  }));
}
