import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/server/auth/current-user";
import { listProjects } from "@/server/data/projects";
import { listDirectory } from "@/server/data/users";
import { SAMPLE_TRANSCRIPT } from "./sample-transcript";
import { TranscriptWorkbench } from "./transcript-workbench";

export const metadata: Metadata = { title: "Create from transcript" };

/** The AI call runs inside this page's server action; allow it time to finish. */
export const maxDuration = 60;

export default async function TranscriptPage() {
  const admin = await requireRole("ADMIN");
  const [directory, projects] = await Promise.all([listDirectory(), listProjects(admin)]);

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Create from transcript"
        description="Paste a planning meeting. The AI drafts projects and tasks with owners, deadlines and estimates from the team directory. Nothing is saved until every check passes."
      />
      <TranscriptWorkbench
        sampleTranscript={SAMPLE_TRANSCRIPT}
        directory={directory.map(({ id, name, role }) => ({ id, name, role }))}
        existingProjectCount={projects.length}
      />
    </>
  );
}
