import type { Metadata } from "next";
import Link from "next/link";
import { SparklesIcon } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { Stat } from "@/components/projects/stat";
import { buttonVariants } from "@/components/ui/button";
import type { Role } from "@/domain/user";
import { formatHours } from "@/lib/utils";
import { requireUser } from "@/server/auth/current-user";
import { listProjects } from "@/server/data/projects";

export const metadata: Metadata = { title: "Projects" };

const COPY: Record<Role, { title: string; description: string; empty: string }> = {
  ADMIN: {
    title: "All projects",
    description: "Every client engagement at NovaWorks, with its manager, delivery date and planned effort.",
    empty: "Paste a planning-meeting transcript and the projects will be created for you.",
  },
  MANAGER: {
    title: "Your projects",
    description: "Client engagements you manage, with every task, owner and estimate.",
    empty: "No projects are assigned to you yet.",
  },
  AGENT: {
    title: "Your projects",
    description: "Projects you contribute to. Inside each project you see only your own tasks.",
    empty: "You are not assigned to any project yet.",
  },
};

export default async function ProjectsPage() {
  const viewer = await requireUser();
  const projects = await listProjects(viewer);
  const copy = COPY[viewer.role];
  const isAdmin = viewer.role === "ADMIN";

  const createButton = (
    <Link href="/transcript" className={buttonVariants()}>
      <SparklesIcon />
      Create from transcript
    </Link>
  );

  const taskCount = projects.reduce((sum, project) => sum + project.taskCount, 0);
  const hours = projects.reduce((sum, project) => sum + project.totalHours, 0);

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} actions={isAdmin && createButton} />

      {isAdmin && projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Projects" value={projects.length} />
          <Stat label="Tasks" value={taskCount} />
          <Stat label="Planned effort" value={formatHours(hours)} />
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description={copy.empty} action={isAdmin && createButton} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} ownTasksOnly={viewer.role === "AGENT"} />
          ))}
        </div>
      )}
    </>
  );
}
