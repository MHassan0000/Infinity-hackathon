/**
 * Runs the supplied meeting transcript through the live app (POST /api/transcript)
 * and compares the saved projects/tasks with the organizer answer key.
 *
 *   npm run dev                      # in another terminal
 *   npm run verify:ai                # original transcript
 *   npm run verify:ai -- changed     # QuickServe integration changed to 12h / 23 Oct
 *
 * Needs SESSION_SECRET (from .env.local) to sign an admin session.
 * Creates real records: run `npm run db:reset` afterwards for a clean demo.
 */
import { SignJWT } from "jose";
import { SAMPLE_TRANSCRIPT } from "../src/app/(workspace)/transcript/sample-transcript.ts";

const variant = process.argv[2] ?? "original";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const key = new TextEncoder().encode(process.env.SESSION_SECRET!);
const cookie = async (id: string) =>
  "nw_session=" + (await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(id).setIssuedAt().setExpirationTime("1h").sign(key));

let transcript = SAMPLE_TRANSCRIPT;
const expected: Record<string, [string, string, number]> = {
  "product catalog ui": ["DEV01", "2026-10-12", 12], "demo cart ui": ["DEV01", "2026-10-15", 8],
  "product and cart apis": ["DEV02", "2026-10-14", 14], "website integration and testing": ["DEV01", "2026-10-19", 6],
  "login and profile screens": ["DEV03", "2026-10-12", 8], "service booking screens": ["DEV03", "2026-10-17", 12],
  "booking and account apis": ["DEV02", "2026-10-16", 16], "mobile integration and testing": ["DEV04", "2026-10-22", 10],
  "faq document processing": ["DEV06", "2026-10-13", 10], "assistant answer generation": ["DEV05", "2026-10-17", 14],
  "human escalation flow": ["DEV05", "2026-10-18", 6], "assistant evaluation and testing": ["DEV06", "2026-10-21", 8],
};
const expectedProjects: Record<string, [string, string]> = {
  "urbancart website": ["PM01", "2026-10-20"], "quickserve mobile app": ["PM02", "2026-10-24"], "helpdeskpro ai assistant": ["PM03", "2026-10-22"],
};
if (variant === "changed") {
  // Organizer's suggested changed-input test: QuickServe integration -> 12 hours, 23 October.
  transcript = transcript
    .replace("Usman owns Mobile integration and testing: 10 hours, 22 October.", "Usman owns Mobile integration and testing: 12 hours, 23 October.")
    .replace("Bilal: Final agreement: Mobile integration and testing, Usman, 10 hours, 22 October.", "Bilal: Final agreement: Mobile integration and testing, Usman, 12 hours, 23 October.");
  expected["mobile integration and testing"] = ["DEV04", "2026-10-23", 12];
}

const started = Date.now();
const res = await fetch(`${APP_URL}/api/transcript`, {
  method: "POST",
  headers: { cookie: await cookie("ADMIN"), "content-type": "application/json" },
  body: JSON.stringify({ transcript }),
});
const outcome = await res.json();
console.log(`[${variant}] HTTP ${res.status} in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${outcome.status}`);
if (outcome.status !== "created") { console.log(JSON.stringify(outcome, null, 2).slice(0, 3000)); process.exit(1); }

let problems = 0, taskCount = 0;
for (const p of outcome.projects) {
  const detail = (await (await fetch(`${APP_URL}/api/projects/${p.id}`, { headers: { cookie: await cookie("ADMIN") } })).json()).project;
  const exp = expectedProjects[detail.name.toLowerCase()];
  const ok = exp && exp[0] === detail.manager.id && exp[1] === detail.deadline;
  if (!ok) problems++;
  console.log(`${ok ? "✓" : "✗"} ${detail.name} | ${detail.clientName} | ${detail.manager.id} | ${detail.deadline} | ${detail.taskCount} tasks ${detail.totalHours}h`);
  for (const t of detail.tasks) {
    taskCount++;
    const e = expected[t.title.toLowerCase()];
    const tok = e && e[0] === t.assignee.id && e[1] === t.deadline && e[2] === t.estimatedHours;
    if (!tok) problems++;
    console.log(`   ${tok ? "✓" : "✗"} ${t.title} | ${t.assignee.id} | ${t.deadline} | ${t.estimatedHours}h${tok ? "" : `   expected ${JSON.stringify(e)}`}`);
  }
}
console.log(`excluded: ${JSON.stringify(outcome.excluded)}`);
console.log(`RESULT: ${outcome.projects.length} projects, ${taskCount} tasks, ${problems} mismatches vs answer key`);
