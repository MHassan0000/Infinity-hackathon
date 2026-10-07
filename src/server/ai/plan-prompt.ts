import "server-only";
import type { AppUser } from "@/domain/user";

/** What the model is allowed to know about each employee. No emails, no credentials. */
export type DirectoryForAi = Pick<AppUser, "id" | "name" | "role" | "specialization" | "skills">;

export function toAiDirectory(directory: readonly AppUser[]): DirectoryForAi[] {
  return directory
    .filter((person) => person.role !== "ADMIN")
    .map(({ id, name, role, specialization, skills }) => ({ id, name, role, specialization, skills }));
}

export function buildSystemPrompt(fallbackDate: string): string {
  return `You are the delivery-planning assistant inside the NovaWorks Technologies project CRM.
You turn a meeting transcript into client projects and developer tasks, returned as JSON matching the provided schema.

Rules:
1. Use the FINAL agreed decisions. When a value (deadline, estimate, owner, title) is discussed more than once, use the last agreed value. A closing recap overrides earlier discussion.
2. Create only the projects and tasks that were agreed. Never create tasks for features that were rejected, excluded, deferred or called future work. List those in "excluded" as short phrases, e.g. "Payment gateway (UrbanCart) - out of scope for this phase".
3. Assign people only by their "id" from the team directory: managerId must be a MANAGER, assigneeId must be an AGENT. Never invent people. Anyone mentioned who is not in the directory (clients, end users, external contacts) gets nothing assigned; mention them in "excluded".
4. If a required value (manager, task owner, deadline, estimated hours) cannot be determined from the transcript, use an empty string (or 0 for hours). Never guess.
5. Dates are YYYY-MM-DD. Resolve dates such as "20 October" against the meeting date stated in the transcript; if none is stated, use ${fallbackDate} as the meeting date.
6. estimatedHours is the developer effort in hours as stated in the meeting, not the number of calendar days. Do not create tasks for management or meeting time.
7. Keep tasks exactly as the meeting split them: do not merge tasks that were kept separate, even with the same owner, and do not split a task into sub-tasks.
8. Use project names, client names and task titles as spoken in the meeting.
9. Project descriptions summarise the agreed scope and state what is explicitly not included. Task descriptions summarise what the task covers.`;
}

export function buildUserPrompt(directory: readonly DirectoryForAi[], transcript: string): string {
  return `Team directory (the only people who may be assigned):
${JSON.stringify(directory, null, 2)}

Meeting transcript:
"""
${transcript}
"""`;
}

/**
 * JSON Schema for structured output. Person ids are constrained to real
 * directory ids (or "" when unresolved), so the model cannot invent an employee.
 */
export function buildPlanJsonSchema(directory: readonly DirectoryForAi[]) {
  const idsFor = (role: AppUser["role"]) => [
    ...directory.filter((person) => person.role === role).map((person) => person.id),
    "",
  ];
  const text = { type: "string" } as const;
  const isoDate = { type: "string", description: "YYYY-MM-DD, or empty string if unknown" } as const;

  return {
    type: "object",
    additionalProperties: false,
    required: ["projects", "excluded"],
    properties: {
      projects: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "clientName", "description", "managerId", "deadline", "tasks"],
          properties: {
            name: text,
            clientName: text,
            description: text,
            managerId: { type: "string", enum: idsFor("MANAGER") },
            deadline: isoDate,
            tasks: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "description", "assigneeId", "deadline", "estimatedHours"],
                properties: {
                  title: text,
                  description: text,
                  assigneeId: { type: "string", enum: idsFor("AGENT") },
                  deadline: isoDate,
                  estimatedHours: { type: "number" },
                },
              },
            },
          },
        },
      },
      excluded: { type: "array", items: text },
    },
  };
}
