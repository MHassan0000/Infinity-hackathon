/** Deletes all generated projects (tasks cascade). Seeded users are kept. */
import { db, schema } from "./db.mts";

const deleted = await db.delete(schema.projects).returning({ id: schema.projects.id });
console.log(`Deleted ${deleted.length} projects and their tasks. Users were kept.`);
