import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { DueDate } from "@/components/projects/due-date";
import { Stat } from "@/components/projects/stat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/domain/dates";
import { formatHours } from "@/lib/utils";
import { requireRole } from "@/server/auth/current-user";
import { type AssignedTask, listAssignedTasks } from "@/server/data/tasks";

export const metadata: Metadata = { title: "My tasks" };

function groupByProject(tasks: AssignedTask[]) {
  const groups = new Map<string, { project: AssignedTask["project"]; tasks: AssignedTask[] }>();
  for (const task of tasks) {
    const group = groups.get(task.project.id) ?? { project: task.project, tasks: [] };
    group.tasks.push(task);
    groups.set(task.project.id, group);
  }
  return [...groups.values()];
}

export default async function MyTasksPage() {
  const viewer = await requireRole("AGENT");
  const tasks = await listAssignedTasks(viewer);
  const groups = groupByProject(tasks);
  const hours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const next = tasks[0];

  return (
    <>
      <PageHeader
        eyebrow={`${viewer.name} · ${viewer.specialization}`}
        title="My tasks"
        description="Everything assigned to you, ordered by deadline."
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="Nothing assigned yet"
          description="When the administrator creates projects from a planning meeting, your tasks appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Assigned tasks" value={tasks.length} />
            <Stat label="Estimated effort" value={formatHours(hours)} />
            <div className="col-span-2 sm:col-span-1">
              <Stat label="Next deadline" value={next ? formatDate(next.deadline) : "—"} />
            </div>
          </div>

          {groups.map(({ project, tasks: projectTasks }) => (
            <Card key={project.id} className="pb-2">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project.clientName} · Managed by {project.managerName} · Delivery {formatDate(project.deadline)}
                  </CardDescription>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline [&_svg]:size-4"
                >
                  Open project
                  <ArrowRightIcon />
                </Link>
              </CardHeader>
              <CardContent className="px-2">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[55%]">Task</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Estimate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <DueDate date={task.deadline} compact />
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatHours(task.estimatedHours)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
