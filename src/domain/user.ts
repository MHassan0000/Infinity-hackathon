export const ROLES = ["ADMIN", "MANAGER", "AGENT"] as const;

export type Role = (typeof ROLES)[number];

/** A user as the application sees it. Never carries credentials. */
export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization: string;
  skills: string[];
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Project manager",
  AGENT: "Developer",
};

/** The landing page each role sees right after signing in. */
export function homePathFor(role: Role): string {
  return role === "AGENT" ? "/my-tasks" : "/projects";
}
