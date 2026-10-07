import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ClockIcon, UserIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/page-header";
import { DeliveryRunway } from "@/components/projects/delivery-runway";
import { DueDate } from "@/components/projects/due-date";
import { TaskTable } from "@/components/projects/task-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHours, pluralize } from "@/lib/utils";
import { requireUser } from "@/server/auth/current-user";
import { getProject } from "@/server/data/projects";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const viewer = await requireUser();
  const project = await getProject(viewer, projectId);

  // Missing and forbidden look identical, so a URL can't be used to probe for projects.
  if (!project) notFound();

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link
          href="/projects"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground [&_svg]:size-4"
        >
          <ArrowLeftIcon />
          Projects
        </Link>
        <PageHeader eyebrow={project.clientName} title={project.name} />
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Manager</dt>
            <dd className="inline-flex items-center gap-1.5 font-medium [&_svg]:size-3.5">
              <UserIcon />
              {project.manager.name}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Delivery</dt>
            <dd>
              <DueDate date={project.deadline} />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Planned effort</dt>
            <dd className="inline-flex items-center gap-1.5 font-mono [&_svg]:size-3.5">
              <ClockIcon />
              {formatHours(project.totalHours)} across {pluralize(project.taskCount, "task")}
            </dd>
          </div>
        </dl>
      </div>

      {viewer.role === "AGENT" && (
        <Alert>
          <UserIcon />
          <AlertDescription>
            You&apos;re seeing only the tasks assigned to you. Other developers&apos; tasks in this project are private
            to them and the project manager.
          </AlertDescription>
        </Alert>
      )}

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <DeliveryRunway deadline={project.deadline} tasks={project.tasks} />

      <Card className="pb-2">
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Owner, deadline and estimated developer effort for each piece of work.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <TaskTable tasks={project.tasks} />
        </CardContent>
      </Card>
    </>
  );
}
