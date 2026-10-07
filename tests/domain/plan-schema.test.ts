import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectPlanSchema } from "../../src/domain/plan.ts";

describe("projectPlanSchema (parsing AI output)", () => {
  it("parses a well-formed plan unchanged", () => {
    const input = {
      projects: [
        {
          name: "UrbanCart Website",
          clientName: "UrbanCart Clothing",
          description: "Demo cart only",
          managerId: "PM01",
          deadline: "2026-10-20",
          tasks: [
            { title: "Demo cart UI", description: "", assigneeId: "DEV01", deadline: "2026-10-15", estimatedHours: 8 },
          ],
        },
      ],
      excluded: ["Payment gateway"],
    };
    assert.deepEqual(projectPlanSchema.parse(input), input);
  });

  it("turns missing or null values into empty strings so they can be reviewed", () => {
    const plan = projectPlanSchema.parse({
      projects: [{ name: "  Alpha  ", clientName: null, managerId: null, deadline: undefined, tasks: [] }],
    });
    const [project] = plan.projects;
    assert.equal(project.name, "Alpha");
    assert.equal(project.clientName, "");
    assert.equal(project.managerId, "");
    assert.equal(project.deadline, "");
    assert.equal(project.description, "");
  });

  it("coerces numeric strings for hours and zeroes anything unparseable", () => {
    const plan = projectPlanSchema.parse({
      projects: [
        {
          name: "A",
          tasks: [
            { title: "One", estimatedHours: "12" },
            { title: "Two", estimatedHours: "about a day" },
            { title: "Three", estimatedHours: null },
          ],
        },
      ],
    });
    assert.deepEqual(
      plan.projects[0].tasks.map((task) => task.estimatedHours),
      [12, 0, 0],
    );
  });

  it("defaults optional collections", () => {
    const plan = projectPlanSchema.parse({ projects: [{ name: "A" }] });
    assert.deepEqual(plan.excluded, []);
    assert.deepEqual(plan.projects[0].tasks, []);
  });

  it("rejects output that is not a plan at all", () => {
    assert.equal(projectPlanSchema.safeParse({ result: "3 projects" }).success, false);
    assert.equal(projectPlanSchema.safeParse({ projects: "UrbanCart" }).success, false);
  });
});
