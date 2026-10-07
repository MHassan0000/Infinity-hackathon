import "./load-env";
import { db } from "@/server/db/client";
import { projects } from "@/server/db/schema";

/** Deletes all generated projects (tasks cascade). Seeded users are kept. */
async function reset() {
  const deleted = await db.delete(projects).returning({ id: projects.id });
  console.log(`Deleted ${deleted.length} projects and their tasks. Users were kept.`);
}

reset().catch((error) => {
  console.error(error);
  process.exit(1);
});
