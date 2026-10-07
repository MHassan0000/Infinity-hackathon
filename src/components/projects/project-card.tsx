import Link from "next/link";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHours, pluralize } from "@/lib/utils";
import type { ProjectSummary } from "@/server/data/projects";
import { DueDate } from "./due-date";

export function ProjectCard({
  project,
  ownTasksOnly = false,
}: {
  project: ProjectSummary;
  /** Agents only see their own tasks, so the count is labelled accordingly. */
  ownTasksOnly?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="h-full transition-[border-color,box-shadow] group-hover:border-primary/40 group-hover:shadow-md">
        <CardHeader>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="group-hover:text-primary">{project.name}</CardTitle>
            <CardDescription>{project.clientName}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          <DueDate date={project.deadline} />
          {project.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t border-border pt-4 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <UserAvatar name={project.manager.name} role="MANAGER" className="size-6 text-[9px]" />
            <span className="truncate">{project.manager.name}</span>
          </span>
          <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
            {pluralize(project.taskCount, ownTasksOnly ? "task for you" : "task", ownTasksOnly ? "tasks for you" : "tasks")} ·{" "}
            {formatHours(project.totalHours)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
