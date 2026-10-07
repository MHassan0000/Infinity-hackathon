import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_USERS } from "../../src/domain/demo-users.ts";
import type { ProjectPlan } from "../../src/domain/plan.ts";
import { validatePlan } from "../../src/domain/validate-plan.ts";
import { answerKeyPlan } from "../fixtures/answer-key.ts";

const issuesFor = (plan: ProjectPlan) => validatePlan(plan, DEMO_USERS);
const paths = (plan: ProjectPlan) => issuesFor(plan).map((issue) => issue.path);

/** Applies a mutation to a fresh copy of the answer key. */
function mutated(change: (plan: ProjectPlan) => void): ProjectPlan {
  const plan = answerKeyPlan();
  change(plan);
  return plan;
}

describe("validatePlan", () => {
  it("accepts the organizer answer key (3 projects, 12 tasks)", () => {
    const plan = answerKeyPlan();
    assert.equal(plan.projects.length, 3);
    assert.equal(plan.projects.flatMap((project) => project.tasks).length, 12);
    assert.deepEqual(issuesFor(plan), []);
  });

  it("accepts the organizer's changed-input variant (QuickServe integration 12h, 23 Oct)", () => {
    const plan = mutated((p) => {
      Object.assign(p.projects[1].tasks[3], { estimatedHours: 12, deadline: "2026-10-23" });
    });
    assert.deepEqual(issuesFor(plan), []);
  });

  it("rejects an empty plan", () => {
    assert.deepEqual(paths({ projects: [], excluded: [] }), ["projects"]);
  });

  it("flags a manager the transcript could not resolve", () => {
    const plan = mutated((p) => {
      p.projects[0].managerId = "";
    });
    assert.deepEqual(paths(plan), ["projects[0].managerId"]);
    assert.match(issuesFor(plan)[0].message, /No project manager could be resolved/);
  });

  it("rejects a developer as project manager", () => {
    const plan = mutated((p) => {
      p.projects[0].managerId = "DEV01";
    });
    assert.match(issuesFor(plan)[0].message, /Ali Raza is not a project manager/);
  });

  it("rejects a manager as task assignee", () => {
    const plan = mutated((p) => {
      p.projects[0].tasks[0].assigneeId = "PM01";
    });
    assert.deepEqual(paths(plan), ["projects[0].tasks[0].assigneeId"]);
    assert.match(issuesFor(plan)[0].message, /Ayesha Khan is not a developer/);
  });

  it("never accepts people outside the directory (e.g. Kamran)", () => {
    const plan = mutated((p) => {
      p.projects[2].tasks[0].assigneeId = "KAMRAN";
    });
    assert.match(issuesFor(plan)[0].message, /"KAMRAN" is not in the NovaWorks team directory/);
  });

  it("rejects a task due after its project deadline", () => {
    const plan = mutated((p) => {
      p.projects[0].tasks[3].deadline = "2026-10-21";
    });
    assert.deepEqual(paths(plan), ["projects[0].tasks[3].deadline"]);
    assert.match(issuesFor(plan)[0].message, /after the project deadline 2026-10-20/);
  });

  it("accepts a task due on the project deadline itself", () => {
    const plan = mutated((p) => {
      p.projects[0].tasks[3].deadline = "2026-10-20";
    });
    assert.deepEqual(issuesFor(plan), []);
  });

  it("rejects impossible or missing dates", () => {
    const plan = mutated((p) => {
      p.projects[0].deadline = "2026-02-30";
      p.projects[1].tasks[0].deadline = "";
    });
    assert.deepEqual(paths(plan), ["projects[0].deadline", "projects[1].tasks[0].deadline"]);
  });

  it("requires positive estimated hours", () => {
    const plan = mutated((p) => {
      p.projects[0].tasks[0].estimatedHours = 0;
      p.projects[0].tasks[1].estimatedHours = -4;
    });
    assert.deepEqual(paths(plan), ["projects[0].tasks[0].estimatedHours", "projects[0].tasks[1].estimatedHours"]);
  });

  it("requires names, client and at least one task per project", () => {
    const plan = mutated((p) => {
      Object.assign(p.projects[2], { name: "", clientName: "", tasks: [] });
    });
    assert.deepEqual(paths(plan), ["projects[2].name", "projects[2].clientName", "projects[2].tasks"]);
  });

  it("reports every problem at once with a readable location", () => {
    const plan = mutated((p) => {
      p.projects[1].managerId = "";
      p.projects[1].tasks[3].assigneeId = "";
      p.projects[1].tasks[3].estimatedHours = 0;
    });
    const issues = issuesFor(plan);
    assert.equal(issues.length, 3);
    assert.equal(issues[1].context, "QuickServe Mobile App › Mobile integration and testing");
  });
});
