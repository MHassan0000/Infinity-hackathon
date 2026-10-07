import "server-only";
import { and, eq, exists, type SQL } from "drizzle-orm";
import type { AppUser } from "@/domain/user";
import { db } from "@/server/db/client";
import { projects, tasks } from "@/server/db/schema";

/**
 * Row-level access rules from the brief, expressed once as SQL conditions and
 * applied by every query in the data layer:
 *
 *   ADMIN   → every project and task
 *   MANAGER → projects they manage, with all of those projects' tasks
 *   AGENT   → projects containing a task assigned to them, and only their own tasks
 *
 * `undefined` means "no restriction" (Drizzle ignores it inside `and()`).
 */
export function projectAccess(viewer: AppUser): SQL | undefined {
  switch (viewer.role) {
    case "ADMIN":
      return undefined;
    case "MANAGER":
      return eq(projects.managerId, viewer.id);
    case "AGENT":
      return exists(
        db
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.projectId, projects.id), eq(tasks.assigneeId, viewer.id))),
      );
  }
}

export function taskAccess(viewer: AppUser): SQL | undefined {
  return viewer.role === "AGENT" ? eq(tasks.assigneeId, viewer.id) : undefined;
}
