import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysBetween, formatDate, isIsoDate } from "../../src/domain/dates.ts";
import { DEMO_USERS } from "../../src/domain/demo-users.ts";
import { homePathFor } from "../../src/domain/user.ts";

describe("dates", () => {
  it("accepts real YYYY-MM-DD dates only", () => {
    assert.equal(isIsoDate("2026-10-20"), true);
    assert.equal(isIsoDate("2028-02-29"), true);
    assert.equal(isIsoDate("2026-02-30"), false);
    assert.equal(isIsoDate("2026-13-01"), false);
    assert.equal(isIsoDate("20 October 2026"), false);
    assert.equal(isIsoDate(""), false);
  });

  it("formats deadlines without shifting the day across timezones", () => {
    assert.equal(formatDate("2026-10-20"), "20 Oct 2026");
    assert.equal(formatDate("2026-01-01"), "1 Jan 2026");
  });

  it("counts whole days between dates", () => {
    assert.equal(daysBetween("2026-10-07", "2026-10-20"), 13);
    assert.equal(daysBetween("2026-10-20", "2026-10-07"), -13);
    assert.equal(daysBetween("2026-10-20", "2026-10-20"), 0);
  });
});

describe("roles and demo accounts", () => {
  it("sends each role to its own home page", () => {
    assert.equal(homePathFor("ADMIN"), "/projects");
    assert.equal(homePathFor("MANAGER"), "/projects");
    assert.equal(homePathFor("AGENT"), "/my-tasks");
  });

  it("seeds exactly one admin, three managers and six developers", () => {
    const count = (role: string) => DEMO_USERS.filter((user) => user.role === role).length;
    assert.equal(DEMO_USERS.length, 10);
    assert.equal(count("ADMIN"), 1);
    assert.equal(count("MANAGER"), 3);
    assert.equal(count("AGENT"), 6);
  });

  it("uses unique ids and emails", () => {
    assert.equal(new Set(DEMO_USERS.map((user) => user.id)).size, DEMO_USERS.length);
    assert.equal(new Set(DEMO_USERS.map((user) => user.email)).size, DEMO_USERS.length);
  });
});
