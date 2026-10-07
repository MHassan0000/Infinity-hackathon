import type { PlanProject, PlanTask, ProjectPlan } from "../../src/domain/plan.ts";

/**
 * The organizer's expected result for the supplied transcript (challenge pack,
 * section 9), expressed as the plan shape the AI returns.
 */
const task = (title: string, assigneeId: string, deadline: string, estimatedHours: number): PlanTask => ({
  title,
  description: "",
  assigneeId,
  deadline,
  estimatedHours,
});

const project = (
  name: string,
  clientName: string,
  managerId: string,
  deadline: string,
  tasks: PlanTask[],
): PlanProject => ({ name, clientName, description: "", managerId, deadline, tasks });

export function answerKeyPlan(): ProjectPlan {
  return {
    projects: [
      project("UrbanCart Website", "UrbanCart Clothing", "PM01", "2026-10-20", [
        task("Product catalog UI", "DEV01", "2026-10-12", 12),
        task("Demo cart UI", "DEV01", "2026-10-15", 8),
        task("Product and cart APIs", "DEV02", "2026-10-14", 14),
        task("Website integration and testing", "DEV01", "2026-10-19", 6),
      ]),
      project("QuickServe Mobile App", "QuickServe Services", "PM02", "2026-10-24", [
        task("Login and profile screens", "DEV03", "2026-10-12", 8),
        task("Service booking screens", "DEV03", "2026-10-17", 12),
        task("Booking and account APIs", "DEV02", "2026-10-16", 16),
        task("Mobile integration and testing", "DEV04", "2026-10-22", 10),
      ]),
      project("HelpDeskPro AI Assistant", "HelpDeskPro Solutions", "PM03", "2026-10-22", [
        task("FAQ document processing", "DEV06", "2026-10-13", 10),
        task("Assistant answer generation", "DEV05", "2026-10-17", 14),
        task("Human escalation flow", "DEV05", "2026-10-18", 6),
        task("Assistant evaluation and testing", "DEV06", "2026-10-21", 8),
      ]),
    ],
    excluded: ["Payment gateway (UrbanCart)", "Live maps (QuickServe)", "Kamran - not a NovaWorks employee"],
  };
}
