import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// Relative import with extension: DB scripts load this file with plain Node (no path aliases).
import { ROLES } from "../../domain/user.ts";

export const roleEnum = pgEnum("role", ROLES);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  /** Stable reference code from the brief (ADMIN, PM01, DEV01, …). */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  specialization: text("specialization").notNull(),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  createdAt: createdAt(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    clientName: text("client_name").notNull(),
    description: text("description").notNull().default(""),
    managerId: text("manager_id")
      .notNull()
      .references(() => users.id),
    deadline: date("deadline", { mode: "string" }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("projects_manager_id_idx").on(table.managerId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    assigneeId: text("assignee_id")
      .notNull()
      .references(() => users.id),
    deadline: date("deadline", { mode: "string" }).notNull(),
    estimatedHours: doublePrecision("estimated_hours").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_assignee_id_idx").on(table.assigneeId),
    check("tasks_estimated_hours_positive", sql`${table.estimatedHours} > 0`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type NewTaskRow = typeof tasks.$inferInsert;
