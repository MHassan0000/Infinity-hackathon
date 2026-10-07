import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_USERS } from "../../src/domain/demo-users.ts";
import {
  buildPlanJsonSchema,
  buildSystemPrompt,
  buildUserPrompt,
  toAiDirectory,
} from "../../src/server/ai/plan-prompt.ts";

const directory = toAiDirectory(DEMO_USERS.map((user) => ({ ...user, passwordHash: "hash" })));

describe("AI directory", () => {
  it("sends only managers and developers, without emails or credentials", () => {
    assert.equal(directory.length, 9);
    assert.ok(directory.every((person) => person.role !== "ADMIN"));
    for (const person of directory) {
      assert.deepEqual(Object.keys(person).sort(), ["id", "name", "role", "skills", "specialization"]);
    }
  });
});

describe("structured-output schema", () => {
  const schema = buildPlanJsonSchema(directory);
  const projectItem = schema.properties.projects.items;
  const taskItem = projectItem.properties.tasks.items;

  it("limits managerId to real managers (or empty when unresolved)", () => {
    assert.deepEqual(projectItem.properties.managerId.enum, ["PM01", "PM02", "PM03", ""]);
  });

  it("limits assigneeId to real developers (or empty when unresolved)", () => {
    assert.deepEqual(taskItem.properties.assigneeId.enum, ["DEV01", "DEV02", "DEV03", "DEV04", "DEV05", "DEV06", ""]);
  });

  it("is strict: every field required, no extra properties", () => {
    for (const node of [schema, projectItem, taskItem]) {
      assert.equal(node.additionalProperties, false);
      assert.deepEqual([...node.required].sort(), Object.keys(node.properties).sort());
    }
  });
});

describe("prompts", () => {
  it("states the rules the answer key depends on", () => {
    const prompt = buildSystemPrompt("2026-10-07");
    assert.match(prompt, /last agreed value/);
    assert.match(prompt, /recap overrides earlier discussion/);
    assert.match(prompt, /Never invent people/);
    assert.match(prompt, /rejected, excluded, deferred/);
    assert.match(prompt, /not the number of calendar days/);
    assert.match(prompt, /2026-10-07/);
  });

  it("includes the directory and the transcript, delimited", () => {
    const message = buildUserPrompt(directory, "Ayesha: hello");
    assert.match(message, /"id": "PM01"/);
    assert.match(message, /"""\nAyesha: hello\n"""/);
    assert.doesNotMatch(message, /novaworks\.example/);
  });
});
