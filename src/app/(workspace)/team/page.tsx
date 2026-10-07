import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLES } from "@/domain/user";
import { requireUser } from "@/server/auth/current-user";
import { listDirectory } from "@/server/data/users";

export const metadata: Metadata = { title: "Team" };

const SECTION_TITLES = {
  ADMIN: "Administration",
  MANAGER: "Project managers",
  AGENT: "Developers",
} as const;

export default async function TeamPage() {
  await requireUser();
  const people = await listDirectory();

  return (
    <>
      <PageHeader
        title="Team directory"
        description="The NovaWorks people the AI can assign work to. Managed by setup script — read only."
      />

      {ROLES.map((role) => {
        const members = people.filter((person) => person.role === role);
        if (members.length === 0) return null;
        return (
          <section key={role} aria-labelledby={`team-${role}`} className="flex flex-col gap-3">
            <h2 id={`team-${role}`} className="text-sm font-medium text-muted-foreground">
              {SECTION_TITLES[role]} · {members.length}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((person) => (
                <li key={person.id} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <UserAvatar name={person.name} role={person.role} className="size-10 text-xs" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{person.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ROLE_LABELS[person.role]} · {person.specialization}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{person.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {person.skills.map((skill) => (
                        <Badge key={skill} variant="muted">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">{person.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
