# NovaWorks Delivery — AI Meeting-to-Project CRM

The administrator pastes a planning-meeting transcript. The AI turns it into projects and tasks, with managers, developers, deadlines and estimated hours. Each person then sees only the work they're allowed to see.

Built for **The Infinity Hack '26** (AI Project Manager challenge).

## Team
- Team name: _[team name]_
- Members and responsibilities: _[names and responsibilities]_
- Repository: _[GitHub URL]_

## What Works
- **Seeded login.** The ten demo accounts (1 admin, 3 managers, 6 developers) are created by an idempotent seed script. There's no signup.
- **Sessions.** A signed httpOnly cookie identifies the user. Their role is always re-read from the database, never trusted from the client.
- **Create from Transcript** (admin only). It runs four steps:
  1. **AI draft:** the transcript and team directory go to the AI, which returns a draft plan in a fixed JSON schema. Passwords and emails are never sent.
  2. **Validation:** the server checks every rule. The manager must be a MANAGER and each assignee an AGENT. Dates must be valid, hours must be positive, and no task can be due after its project deadline.
  3. **Save:** all-or-nothing, as one Neon transaction. A failure leaves no partial projects.
  4. **Corrections:** if something can't be resolved, the draft comes back with every issue listed. The admin fixes it and saves without calling the AI again.
- Loading, success and error states. The button is disabled while running, which prevents duplicate creates.
- A **"Left out on purpose"** list shows the features and people the meeting ruled out (e.g. payments, maps, Kamran).
- **Role-based access, enforced in the data layer** for both pages and JSON API requests:
  - Admin: all projects.
  - Manager: projects they manage, with all their tasks.
  - Developer: only their own tasks, plus those projects' name, client and manager.
  - Other projects return 404.
- Projects list, project detail with a delivery timeline and task table, **My tasks** for developers, and a read-only **Team** directory.
- Saved projects and tasks persist in Postgres.
- An admin **Reset demo data** button, plus `npm run db:reset`.

## Technology Stack
- Frontend: Next.js 16 (App Router, React 19 Server Components), Tailwind CSS 4, shadcn-style components
- Backend: Next.js server actions and route handlers on Node.js
- Database: PostgreSQL on Neon, accessed with Drizzle ORM (`neon-http` driver)
- AI: xAI Grok through the OpenAI-compatible Chat Completions API with JSON-schema structured output. The provider can be swapped by changing env vars, e.g. to OpenRouter.
- Authentication: bcrypt password hashes, plus a signed JWT (HS256, `jose`) in an httpOnly, SameSite=Lax cookie. The token carries only the user id.

### Architecture
```
src/
  domain/        Pure business rules and types: roles, plan schema (zod), plan validation, dates. No I/O.
  server/
    config/      Validated environment access
    db/          Drizzle schema + Neon client
    auth/        Password hashing, session cookie, current user
    data/        Data access layer. Every query is scoped by access-policy.ts
    ai/          Chat-completions client, prompt, structured-output schema, plan extraction
    services/    Use cases: create from transcript, save reviewed plan, reset
  app/           Routes, layouts, server actions (thin controllers), JSON API
  components/    UI components (ui/ = primitives)
scripts/         migrate, seed, reset
drizzle/         SQL migrations
```

## Links
- Live application: https://infinity-hackathon-eight.vercel.app
- Demo video: _[URL]_

## Requirements
- Node.js 22.18+ (tested on Node 24; the DB scripts use Node's built-in TypeScript support) and npm
- A PostgreSQL database (Neon free tier works)
- An API key for an OpenAI-compatible provider (xAI Grok, or OpenRouter as backup)

## Run Locally
```sh
git clone [YOUR_REPOSITORY_URL]
cd infinity-hackathon
npm install
cp .env.example .env.local      # then fill in the values
npm run db:migrate              # create tables
npm run db:seed                 # create the ten demo users (safe to re-run)
npm run dev                     # http://localhost:3000
```
Only `npm run dev` needs to keep running.

## Environment Variables
| Variable | Purpose | Where configured |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon pooled URL) | `.env.local` / Vercel |
| `SESSION_SECRET` | Signs session cookies (`openssl rand -base64 32`) | `.env.local` / Vercel |
| `AI_API_KEY` | AI provider key (server only) | `.env.local` / Vercel |
| `AI_BASE_URL` | OpenAI-compatible base URL, default `https://api.x.ai/v1` | `.env.local` / Vercel |
| `AI_MODEL` | Model id, e.g. a Grok model from the xAI console | `.env.local` / Vercel |

None of these are exposed to the browser.

## Demo Login Accounts
These emails are fictional identifiers, not mailboxes. The login page has one-click buttons that fill in each account.

| Role | Name | Demo email | Password |
| --- | --- | --- | --- |
| Admin | Admin | admin@novaworks.example | Demo123! |
| Manager | Ayesha Khan | ayesha@novaworks.example | Demo123! |
| Manager | Bilal Ahmed | bilal@novaworks.example | Demo123! |
| Manager | Hina Malik | hina@novaworks.example | Demo123! |
| Agent | Ali Raza | ali@novaworks.example | Demo123! |
| Agent | Hamza Shah | hamza@novaworks.example | Demo123! |
| Agent | Sara Noor | sara@novaworks.example | Demo123! |
| Agent | Usman Tariq | usman@novaworks.example | Demo123! |
| Agent | Zain Abbas | zain@novaworks.example | Demo123! |
| Agent | Maryam Asif | maryam@novaworks.example | Demo123! |

## How Judges Can Test
1. Log in as **admin** and open **Create from transcript**.
2. Click **Use sample meeting** (the supplied transcript), or paste your own.
3. Click **Create from transcript**. Expect 3 projects and 12 tasks, plus a list of what was left out.
4. Open **UrbanCart Website**. Expect manager Ayesha, deadline 20 Oct 2026, and four tasks with owners, deadlines and hours.
5. Sign out, then log in as **Ayesha**. Only UrbanCart appears.
6. Log in as **Ali**. My tasks shows his three UrbanCart tasks only.
7. Log in as **Hamza**. He has two tasks, one in UrbanCart and one in QuickServe.
8. Direct-access check: while logged in as Ali, open `/api/projects` and `/api/projects/<QuickServe id>`. The second returns **404**. Other users' projects and tasks cannot be fetched.
9. Refresh any page. The data persists.
10. Changed input: edit QuickServe integration to 12 hours / 23 October in the transcript, reset the demo data, and create again. That task changes and the others stay the same.

**Reset between tests:** use the **Reset demo data** button on the transcript page, or run `npm run db:reset`. Both delete projects and tasks and keep users.

## Deployment Details
- Deployment status: _[Live / Local only]_
- Frontend + backend: Vercel (one Next.js app)
- Database: Neon PostgreSQL (free tier)
- Deployed branch/commit: _[branch and SHA]_

### How We Deployed
1. Import the GitHub repo in Vercel. The framework preset is Next.js and the build command is `next build`.
2. Set `DATABASE_URL`, `SESSION_SECRET`, `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` in Vercel's Project Settings → Environment Variables.
3. From a laptop with the same `DATABASE_URL`, run `npm run db:migrate && npm run db:seed`.
4. Open the Vercel URL and log in with a demo account.

## Known Limitations
- Created projects and tasks can't be edited in the UI; corrections happen before saving.
- Each "Create from transcript" adds new projects. Use Reset demo data before re-running the same meeting.
- AI output quality depends on the configured model. Validation stops bad output from being saved.
